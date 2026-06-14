import type { TrackType } from '../../types'

export const LABEL_WIDTH = 132
export const RULER_HEIGHT = 28
export const TRACK_HEIGHT = 56
export const TRACK_GAP = 6
export const SNAP_PIXELS = 6
export const RIGHT_GUTTER_PX = 120

export const TRACK_COLOR_VAR: Record<TrackType, string> = {
  video: 'var(--track-video)',
  audio: 'var(--track-audio)',
  image: 'var(--track-image)',
  text: 'var(--track-text)',
}
