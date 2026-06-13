import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  selectClips,
  selectCompositionHeight,
  selectCompositionWidth,
  selectFps,
  selectMediaAssets,
  selectProjectDurationInFrames,
  selectTracks,
} from '../store/selectors'
import type { MainProps } from '../remotion/Main'
import type { MediaAsset } from '../types'

const COMPOSITION_BACKGROUND = '#000000'

export interface CompositionProps {
  inputProps: MainProps
  durationInFrames: number
  width: number
  height: number
  fps: number
}

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

  const inputProps = useMemo<MainProps>(
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
