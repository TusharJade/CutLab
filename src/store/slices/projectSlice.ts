import { createSlice, current, type PayloadAction } from '@reduxjs/toolkit'
import type {
  Clip,
  ClipTransform,
  Keyframe,
  MediaAsset,
  ProjectState,
  Track,
  TrackType,
} from '../../utils/types'
import { DEFAULT_FPS, DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../../utils/constants'
import { createClipFromMedia, mediaTypeToTrackType } from '../../utils/factory'
import { createId } from '../../utils/id'

const TRACK_LABEL: Record<TrackType, string> = {
  video: 'Video',
  audio: 'Audio',
  image: 'Image',
  text: 'Text',
}

const initialState: ProjectState = {
  fps: DEFAULT_FPS,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  tracks: [],
  clips: {},
}

function nextTrackName(state: ProjectState, type: TrackType): string {
  const count = state.tracks.filter((track) => track.type === type).length
  return `${TRACK_LABEL[type]} ${count + 1}`
}

/**
 * Finds the closest start frame on a track where a clip of the given duration
 * fits without overlapping its neighbours. Clips on the same track may touch
 * but never overlap; layering is done by using separate tracks instead.
 */
function resolveNonOverlappingStart(
  clips: Record<string, Clip>,
  track: Track,
  movingClipId: string,
  desiredStart: number,
  duration: number,
): number {
  const occupied = track.clipIds
    .filter((id) => id !== movingClipId)
    .map((id) => clips[id])
    .filter((clip): clip is Clip => Boolean(clip))
    .map((clip) => ({
      start: clip.startFrame,
      end: clip.startFrame + clip.durationInFrames,
    }))
    .sort((a, b) => a.start - b.start)

  const desiredEnd = desiredStart + duration
  const overlaps = occupied.some(
    (slot) => desiredStart < slot.end && desiredEnd > slot.start,
  )
  if (!overlaps) return desiredStart

  let best = desiredStart
  let bestDistance = Number.POSITIVE_INFINITY
  const considerGap = (gapStart: number, gapEnd: number) => {
    if (gapEnd - gapStart < duration) return
    const candidate = Math.min(Math.max(desiredStart, gapStart), gapEnd - duration)
    const distance = Math.abs(candidate - desiredStart)
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }

  let cursor = 0
  for (const slot of occupied) {
    considerGap(cursor, slot.start)
    cursor = Math.max(cursor, slot.end)
  }
  considerGap(cursor, Number.MAX_SAFE_INTEGER)

  return Math.max(0, best)
}

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setCompositionSize(
      state,
      action: PayloadAction<{ width: number; height: number }>,
    ) {
      if (action.payload.width > 0 && action.payload.height > 0) {
        state.width = Math.round(action.payload.width)
        state.height = Math.round(action.payload.height)
      }
    },
    addTrack: {
      reducer(state, action: PayloadAction<{ id: string; type: TrackType }>) {
        const { id, type } = action.payload
        state.tracks.push({
          id,
          name: nextTrackName(state, type),
          type,
          clipIds: [],
        })
      },
      prepare(type: TrackType) {
        return { payload: { id: createId('track'), type } }
      },
    },
    removeTrack(state, action: PayloadAction<string>) {
      const track = state.tracks.find((item) => item.id === action.payload)
      if (!track) return
      track.clipIds.forEach((clipId) => {
        delete state.clips[clipId]
      })
      state.tracks = state.tracks.filter((item) => item.id !== action.payload)
    },
    moveTrack(
      state,
      action: PayloadAction<{ trackId: string; direction: 'up' | 'down' }>,
    ) {
      const { trackId, direction } = action.payload
      const index = state.tracks.findIndex((track) => track.id === trackId)
      if (index === -1) return
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= state.tracks.length) return
      const [moved] = state.tracks.splice(index, 1)
      state.tracks.splice(target, 0, moved)
    },
    addClip(state, action: PayloadAction<Clip>) {
      const clip = action.payload
      const track = state.tracks.find((item) => item.id === clip.trackId)
      if (!track) return
      state.clips[clip.id] = clip
      track.clipIds.push(clip.id)
    },
    removeClip(state, action: PayloadAction<string>) {
      const clip = state.clips[action.payload]
      if (!clip) return
      const track = state.tracks.find((item) => item.id === clip.trackId)
      if (track) {
        track.clipIds = track.clipIds.filter((id) => id !== clip.id)
        if (track.clipIds.length === 0) {
          state.tracks = state.tracks.filter((item) => item.id !== track.id)
        }
      }
      delete state.clips[action.payload]
    },
    removeClipsByMedia(state, action: PayloadAction<string>) {
      const mediaId = action.payload
      const removedClipIds = new Set(
        Object.values(state.clips)
          .filter((clip) => clip.mediaId === mediaId)
          .map((clip) => clip.id),
      )
      if (removedClipIds.size === 0) return
      removedClipIds.forEach((clipId) => delete state.clips[clipId])
      state.tracks = state.tracks
        .map((track) => ({
          ...track,
          clipIds: track.clipIds.filter((id) => !removedClipIds.has(id)),
        }))
        .filter((track) => track.clipIds.length > 0)
    },
    duplicateClip: {
      reducer(state, action: PayloadAction<{ clipId: string; newId: string }>) {
        const source = state.clips[action.payload.clipId]
        if (!source) return
        const track = state.tracks.find((item) => item.id === source.trackId)
        if (!track) return
        const copy: Clip = {
          ...structuredClone(current(source)),
          id: action.payload.newId,
          startFrame: source.startFrame + source.durationInFrames,
        }
        state.clips[copy.id] = copy
        track.clipIds.push(copy.id)
      },
      prepare(clipId: string) {
        return { payload: { clipId, newId: createId('clip') } }
      },
    },
    splitClipAtFrame(
      state,
      action: PayloadAction<{ clipId: string; frame: number }>,
    ) {
      const clip = state.clips[action.payload.clipId]
      if (!clip) return
      const localOffset = Math.round(action.payload.frame - clip.startFrame)
      if (localOffset <= 0 || localOffset >= clip.durationInFrames) return

      const track = state.tracks.find((item) => item.id === clip.trackId)
      if (!track) return

      const sourceSplit =
        clip.type === 'image'
          ? clip.trimStartFrame + localOffset
          : Math.round(clip.trimStartFrame + localOffset * clip.speed)

      const snapshot = structuredClone(current(clip))
      const rightClip: Clip = {
        ...snapshot,
        id: createId('clip'),
        startFrame: clip.startFrame + localOffset,
        durationInFrames: clip.durationInFrames - localOffset,
        trimStartFrame: sourceSplit,
        trimEndFrame: clip.trimEndFrame,
        keyframes: snapshot.keyframes
          .filter((keyframe) => keyframe.frame > localOffset)
          .map((keyframe) => ({
            ...keyframe,
            id: createId('keyframe'),
            frame: keyframe.frame - localOffset,
          })),
      }

      clip.durationInFrames = localOffset
      clip.trimEndFrame = sourceSplit
      clip.keyframes = clip.keyframes.filter(
        (keyframe) => keyframe.frame <= localOffset,
      )

      state.clips[rightClip.id] = rightClip
      const index = track.clipIds.indexOf(clip.id)
      track.clipIds.splice(index + 1, 0, rightClip.id)
    },
    moveClip(
      state,
      action: PayloadAction<{
        clipId: string
        startFrame: number
        trackId?: string
      }>,
    ) {
      const { clipId, startFrame, trackId } = action.payload
      const clip = state.clips[clipId]
      if (!clip) return

      const fromTrackId = clip.trackId
      let destTrack = state.tracks.find((item) => item.id === fromTrackId)
      if (trackId && trackId !== fromTrackId) {
        const toTrack = state.tracks.find((item) => item.id === trackId)
        if (toTrack && toTrack.type === clip.type) {
          if (destTrack) {
            destTrack.clipIds = destTrack.clipIds.filter((id) => id !== clipId)
          }
          toTrack.clipIds.push(clipId)
          clip.trackId = trackId
          destTrack = toTrack
        }
      }

      const desiredStart = Math.max(0, Math.round(startFrame))
      clip.startFrame = destTrack
        ? resolveNonOverlappingStart(
            state.clips,
            destTrack,
            clipId,
            desiredStart,
            clip.durationInFrames,
          )
        : desiredStart

      // Drop the source track if the clip moved away and left it empty.
      if (clip.trackId !== fromTrackId) {
        const source = state.tracks.find((item) => item.id === fromTrackId)
        if (source && source.clipIds.length === 0) {
          state.tracks = state.tracks.filter((item) => item.id !== fromTrackId)
        }
      }
    },
    // Places a media asset on the timeline as a new stacked layer: each call
    // creates a fresh track (Video 1, Video 2, …) and drops the clip at frame 0.
    // The first non-audio import also matches the composition to the media.
    addMediaToTimeline: {
      reducer(
        state,
        action: PayloadAction<{
          media: MediaAsset
          trackId: string
          clipId: string
        }>,
      ) {
        const { media, trackId, clipId } = action.payload
        const trackType = mediaTypeToTrackType(media.type)

        const isFirstClip = Object.keys(state.clips).length === 0
        if (isFirstClip && media.type !== 'audio') {
          state.width = Math.round(media.width)
          state.height = Math.round(media.height)
        }

        state.tracks.push({
          id: trackId,
          name: nextTrackName(state, trackType),
          type: trackType,
          clipIds: [clipId],
        })
        state.clips[clipId] = createClipFromMedia({
          media,
          trackId,
          startFrame: 0,
          fps: state.fps,
          id: clipId,
        })
      },
      prepare(media: MediaAsset) {
        return {
          payload: { media, trackId: createId('track'), clipId: createId('clip') },
        }
      },
    },
    // Moves a clip onto a brand new track of its own type, created at the bottom
    // of the timeline. The source track is cleaned up if it ends up empty.
    moveClipToNewTrack: {
      reducer(
        state,
        action: PayloadAction<{
          clipId: string
          startFrame: number
          trackId: string
        }>,
      ) {
        const { clipId, startFrame, trackId } = action.payload
        const clip = state.clips[clipId]
        if (!clip) return

        const fromTrackId = clip.trackId
        const newTrack: Track = {
          id: trackId,
          name: nextTrackName(state, clip.type),
          type: clip.type,
          clipIds: [clipId],
        }
        state.tracks.push(newTrack)

        const source = state.tracks.find((item) => item.id === fromTrackId)
        if (source) {
          source.clipIds = source.clipIds.filter((id) => id !== clipId)
        }
        clip.trackId = trackId
        clip.startFrame = resolveNonOverlappingStart(
          state.clips,
          newTrack,
          clipId,
          Math.max(0, Math.round(startFrame)),
          clip.durationInFrames,
        )

        if (source && source.clipIds.length === 0) {
          state.tracks = state.tracks.filter((item) => item.id !== fromTrackId)
        }
      },
      prepare({ clipId, startFrame }: { clipId: string; startFrame: number }) {
        return { payload: { clipId, startFrame, trackId: createId('track') } }
      },
    },
    trimClip(
      state,
      action: PayloadAction<{
        clipId: string
        startFrame: number
        durationInFrames: number
        trimStartFrame: number
        trimEndFrame: number
      }>,
    ) {
      const clip = state.clips[action.payload.clipId]
      if (!clip) return
      clip.startFrame = Math.max(0, Math.round(action.payload.startFrame))
      clip.durationInFrames = Math.max(1, Math.round(action.payload.durationInFrames))
      clip.trimStartFrame = Math.max(0, Math.round(action.payload.trimStartFrame))
      clip.trimEndFrame = Math.max(
        clip.trimStartFrame + 1,
        Math.round(action.payload.trimEndFrame),
      )
    },
    updateClip(
      state,
      action: PayloadAction<{ clipId: string; changes: Partial<Clip> }>,
    ) {
      const clip = state.clips[action.payload.clipId]
      if (!clip) return
      Object.assign(clip, action.payload.changes)
    },
    updateClipTransform(
      state,
      action: PayloadAction<{ clipId: string; changes: Partial<ClipTransform> }>,
    ) {
      const clip = state.clips[action.payload.clipId]
      if (!clip) return
      clip.transform = { ...clip.transform, ...action.payload.changes }
    },
    addKeyframe(
      state,
      action: PayloadAction<{ clipId: string; keyframe: Keyframe }>,
    ) {
      const clip = state.clips[action.payload.clipId]
      if (!clip) return
      clip.keyframes.push(action.payload.keyframe)
      clip.keyframes.sort((a, b) => a.frame - b.frame)
    },
    updateKeyframe(
      state,
      action: PayloadAction<{
        clipId: string
        keyframeId: string
        changes: Partial<Keyframe>
      }>,
    ) {
      const clip = state.clips[action.payload.clipId]
      if (!clip) return
      const keyframe = clip.keyframes.find(
        (item) => item.id === action.payload.keyframeId,
      )
      if (!keyframe) return
      Object.assign(keyframe, action.payload.changes)
      if (action.payload.changes.props) {
        keyframe.props = { ...keyframe.props, ...action.payload.changes.props }
      }
      clip.keyframes.sort((a, b) => a.frame - b.frame)
    },
    removeKeyframe(
      state,
      action: PayloadAction<{ clipId: string; keyframeId: string }>,
    ) {
      const clip = state.clips[action.payload.clipId]
      if (!clip) return
      clip.keyframes = clip.keyframes.filter(
        (item) => item.id !== action.payload.keyframeId,
      )
    },
  },
})

export const {
  setCompositionSize,
  addTrack,
  removeTrack,
  moveTrack,
  addClip,
  removeClip,
  removeClipsByMedia,
  duplicateClip,
  splitClipAtFrame,
  moveClip,
  moveClipToNewTrack,
  addMediaToTimeline,
  trimClip,
  updateClip,
  updateClipTransform,
  addKeyframe,
  updateKeyframe,
  removeKeyframe,
} = projectSlice.actions
export default projectSlice.reducer
