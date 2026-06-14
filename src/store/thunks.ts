import type { MediaAsset, TrackType } from '../types'
import { createClipFromMedia, mediaTypeToTrackType } from '../utils/factory'
import {
  addClip,
  addTrack,
  moveClip,
  setCompositionSize,
} from './slices/projectSlice'
import { selectClip } from './slices/editorSlice'
import type { AppDispatch, RootState } from './index'

/**
 * Places a media asset on the timeline as a new stacked layer. Each call
 * creates a fresh track (Video 1, Video 2, …) and drops the clip at frame 0,
 * mirroring Clideo's layer-based add. Clips can be stitched afterwards by
 * dragging them onto the same track.
 */
export function addMediaToTimeline(media: MediaAsset) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const trackType: TrackType = mediaTypeToTrackType(media.type)
    const before = getState()

    // On first import, match the composition to the media so it fills the
    // preview instead of being letterboxed/cropped inside a mismatched canvas.
    const isFirstClip = Object.keys(before.project.clips).length === 0
    if (isFirstClip && media.type !== 'audio') {
      dispatch(
        setCompositionSize({ width: media.width, height: media.height }),
      )
    }

    dispatch(addTrack(trackType))
    const state = getState()
    const track = state.project.tracks[state.project.tracks.length - 1]
    if (!track || track.type !== trackType) return

    const clip = createClipFromMedia({
      media,
      trackId: track.id,
      startFrame: 0,
      fps: state.project.fps,
    })
    dispatch(addClip(clip))
    dispatch(selectClip(clip.id))
  }
}

/**
 * Moves a clip onto a brand new track of its own type, created at the bottom
 * of the timeline. Used when a clip is dragged into the empty "new track"
 * drop zone. The source track is cleaned up automatically if it ends up empty.
 */
export function moveClipToNewTrack({
  clipId,
  startFrame,
}: {
  clipId: string
  startFrame: number
}) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const clip = getState().project.clips[clipId]
    if (!clip) return

    dispatch(addTrack(clip.type))
    const tracks = getState().project.tracks
    const newTrack = tracks[tracks.length - 1]
    if (!newTrack) return

    dispatch(moveClip({ clipId, startFrame, trackId: newTrack.id }))
    dispatch(selectClip(clipId))
  }
}
