import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Clip, ClipTransform, Keyframe, Track, TrackType } from '../../types'
import { DEFAULT_FPS, DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../../utils/factory'
import { createId } from '../../utils/id'

interface ProjectState {
  fps: number
  width: number
  height: number
  tracks: Track[]
  clips: Record<string, Clip>
}

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

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
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
      }
      delete state.clips[action.payload]
    },
    duplicateClip: {
      reducer(state, action: PayloadAction<{ clipId: string; newId: string }>) {
        const source = state.clips[action.payload.clipId]
        if (!source) return
        const track = state.tracks.find((item) => item.id === source.trackId)
        if (!track) return
        const copy: Clip = {
          ...structuredClone(source),
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
      clip.startFrame = Math.max(0, Math.round(startFrame))
      if (trackId && trackId !== clip.trackId) {
        const fromTrack = state.tracks.find((item) => item.id === clip.trackId)
        const toTrack = state.tracks.find((item) => item.id === trackId)
        if (fromTrack && toTrack && toTrack.type === clip.type) {
          fromTrack.clipIds = fromTrack.clipIds.filter((id) => id !== clipId)
          toTrack.clipIds.push(clipId)
          clip.trackId = trackId
        }
      }
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
  addTrack,
  removeTrack,
  moveTrack,
  addClip,
  removeClip,
  duplicateClip,
  moveClip,
  trimClip,
  updateClip,
  updateClipTransform,
  addKeyframe,
  updateKeyframe,
  removeKeyframe,
} = projectSlice.actions
export default projectSlice.reducer
