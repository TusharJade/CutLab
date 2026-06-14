import type { TrackType } from './types'

// ============================================================================
// Composition defaults
// ============================================================================

export const DEFAULT_FPS = 30
export const DEFAULT_WIDTH = 1080
export const DEFAULT_HEIGHT = 1920
export const DEFAULT_IMAGE_DURATION_SECONDS = 5
export const COMPOSITION_BACKGROUND = '#000000'

// ============================================================================
// Timeline layout
// ============================================================================

export const LABEL_WIDTH = 132
export const RULER_HEIGHT = 28
export const TRACK_HEIGHT = 56
export const TRACK_GAP = 6
export const SNAP_PIXELS = 6
export const RIGHT_GUTTER_PX = 120
export const NEW_TRACK_DROP_ID = 'new-track'

export const TRACK_COLOR_VAR: Record<TrackType, string> = {
  video: 'var(--track-video)',
  audio: 'var(--track-audio)',
  image: 'var(--track-image)',
  text: 'var(--track-text)',
}

// ============================================================================
// Timeline ticks (ruler)
// ============================================================================

export const TICK_SECONDS_CANDIDATES = [1, 2, 5, 10, 15, 30, 60, 120, 300]
export const MIN_TICK_SPACING_PX = 64

// ============================================================================
// Editor / zoom
// ============================================================================

export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 30
export const MIN_TIMELINE_FRAMES = 30

// ============================================================================
// Inspector
// ============================================================================

export const SPEED_PRESETS = [0.5, 1, 1.5, 2]

// ============================================================================
// Reverse-playback frame cache
// ============================================================================

export const MAX_DIMENSION = 1280
export const MAX_CACHE_ENTRIES = 3
