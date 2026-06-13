import type { MediaAsset, TrackType } from '../types'
import { createClipFromMedia, mediaTypeToTrackType } from '../utils/factory'
import { addClip, addTrack, setCompositionSize } from './slices/projectSlice'
import { selectClip } from './slices/editorSlice'
import type { AppDispatch, RootState } from './index'

/**
 * Places a media asset on the timeline. Finds the last track of the matching
 * type (or creates one) and appends the clip after the existing clips so it
 * stitches on naturally.
 */
export function addMediaToTimeline(media: MediaAsset) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const trackType: TrackType = mediaTypeToTrackType(media.type)
    let state = getState()

    // On first import, match the composition to the media so it fills the
    // preview instead of being letterboxed/cropped inside a mismatched canvas.
    const isFirstClip = Object.keys(state.project.clips).length === 0
    if (isFirstClip && media.type !== 'audio') {
      dispatch(
        setCompositionSize({ width: media.width, height: media.height }),
      )
    }

    let track = [...state.project.tracks]
      .reverse()
      .find((item) => item.type === trackType)

    if (!track) {
      dispatch(addTrack(trackType))
      state = getState()
      track = [...state.project.tracks]
        .reverse()
        .find((item) => item.type === trackType)
    }
    if (!track) return

    const startFrame = track.clipIds.reduce((max, clipId) => {
      const clip = state.project.clips[clipId]
      return clip ? Math.max(max, clip.startFrame + clip.durationInFrames) : max
    }, 0)

    const clip = createClipFromMedia({
      media,
      trackId: track.id,
      startFrame,
      fps: state.project.fps,
    })
    dispatch(addClip(clip))
    dispatch(selectClip(clip.id))
  }
}
