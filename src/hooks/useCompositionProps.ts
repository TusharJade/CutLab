import { useMemo } from 'react'
import { createSelector } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'
import type {
  CompositionProps,
  MediaAsset,
  TimelineCompositionProps,
} from '../utils/types'
import { COMPOSITION_BACKGROUND, MIN_TIMELINE_FRAMES } from '../utils/constants'

const selectClips = (state: RootState) => state.project.clips
const selectTracks = (state: RootState) => state.project.tracks
const selectFps = (state: RootState) => state.project.fps
const selectMediaAssets = (state: RootState) => state.media.assets
const selectCompositionWidth = (state: RootState) => state.project.width
const selectCompositionHeight = (state: RootState) => state.project.height
const selectProjectDurationInFrames = createSelector(
  [selectClips, selectFps],
  (clips, fps) => {
    const end = Object.values(clips).reduce((max, clip) => {
      return Math.max(max, clip.startFrame + clip.durationInFrames)
    }, 0)
    return Math.max(MIN_TIMELINE_FRAMES, end || fps * 10)
  },
)

export function useCompositionProps(): CompositionProps {
  const tracks = useSelector(selectTracks)
  const clips = useSelector(selectClips)
  const assets = useSelector(selectMediaAssets)
  const fps = useSelector(selectFps)
  const width = useSelector(selectCompositionWidth)
  const height = useSelector(selectCompositionHeight)
  const durationInFrames = useSelector(selectProjectDurationInFrames)

  const mediaRecord = useMemo(() => {
    return assets.reduce<Record<string, MediaAsset>>((record, asset) => {
      record[asset.id] = asset
      return record
    }, {})
  }, [assets])

  const inputProps = useMemo<TimelineCompositionProps>(
    () => ({
      tracks,
      clips,
      media: mediaRecord,
      backgroundColor: COMPOSITION_BACKGROUND,
    }),
    [tracks, clips, mediaRecord],
  )

  return { inputProps, durationInFrames, width, height, fps }
}
