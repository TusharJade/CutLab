import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  SVGProps,
} from 'react'

// ============================================================================
// Media
// ============================================================================

export type MediaType = 'video' | 'audio' | 'image'

export interface MediaAsset {
  id: string
  type: MediaType
  name: string
  objectUrl: string
  thumbnailUrl?: string
  naturalDurationSeconds: number
  width: number
  height: number
}

// ============================================================================
// Transform & geometry
// ============================================================================

export interface CropRect {
  /* Normalized 0..1 crop rectangle relative to source frame */
  x: number
  y: number
  width: number
  height: number
}

export interface ClipTransform {
  /* Pan offset in composition pixels */
  translateX: number
  translateY: number
  /* Uniform scale multiplier (1 = fit) */
  scale: number
  /* Padding (letterbox/pillarbox) in composition pixels */
  padding: number
  paddingColor: string
  crop: CropRect
}

// ============================================================================
// Keyframes & animation
// ============================================================================

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

export interface KeyframeProps {
  scale: number
  translateX: number
  translateY: number
  opacity: number
}

export interface Keyframe {
  id: string
  /* Frame relative to the clip start */
  frame: number
  props: KeyframeProps
  easing: EasingType
}

export interface ResolvedKeyframeProps {
  scale: number
  translateX: number
  translateY: number
  opacity: number
}

// ============================================================================
// Clips & tracks
// ============================================================================

export type TrackType = 'video' | 'audio' | 'image' | 'text'

export interface Clip {
  id: string
  mediaId: string
  type: TrackType
  trackId: string
  /* Position on the timeline, in project frames */
  startFrame: number
  /* Visible length on the timeline, in project frames */
  durationInFrames: number
  /* In/out points within the source media, in project frames */
  trimStartFrame: number
  trimEndFrame: number
  speed: number
  reverse: boolean
  volume: number
  muted: boolean
  fadeInFrames: number
  fadeOutFrames: number
  transform: ClipTransform
  keyframes: Keyframe[]
  /* For text clips */
  text?: string
}

export interface Track {
  id: string
  name: string
  type: TrackType
  clipIds: string[]
}

// ============================================================================
// Project
// ============================================================================

export interface Project {
  fps: number
  width: number
  height: number
  tracks: Track[]
}

// ============================================================================
// Redux state
// ============================================================================

export interface ProjectState {
  fps: number
  width: number
  height: number
  tracks: Track[]
  clips: Record<string, Clip>
}

export interface EditorState {
  selectedClipId: string | null
  /* Playhead position in frames */
  playheadFrame: number
  isPlaying: boolean
  /* Timeline horizontal zoom, in pixels per frame */
  pixelsPerFrame: number
}

export interface MediaState {
  assets: MediaAsset[]
}

// ============================================================================
// Remotion / composition
// ============================================================================

export type RenderMode = 'preview' | 'export'

export type TimelineCompositionProps = {
  tracks: Track[]
  clips: Record<string, Clip>
  media: Record<string, MediaAsset>
  backgroundColor: string
  renderMode?: RenderMode
}

export interface CompositionProps {
  inputProps: TimelineCompositionProps
  durationInFrames: number
  width: number
  height: number
  fps: number
}

export interface ExportArgs {
  inputProps: TimelineCompositionProps
  width: number
  height: number
  fps: number
  durationInFrames: number
  onProgress?: (ratio: number) => void
  signal?: AbortSignal
}

// ============================================================================
// Reverse-playback frame cache
// ============================================================================

export interface ReverseFramesParams {
  mediaId: string
  mediaUrl: string
  trimStartFrame: number
  trimEndFrame: number
  speed: number
  durationInFrames: number
  sourceFrames: number
  fps: number
  sourceWidth: number
  sourceHeight: number
}

export interface CacheEntry {
  /* One bitmap per clip-local frame (may reference shared bitmaps). */
  framesByLocalFrame: ImageBitmap[]
  /* Distinct bitmaps, used only for cleanup. */
  uniqueBitmaps: ImageBitmap[]
}

// ============================================================================
// Timeline
// ============================================================================

export interface Tick {
  frame: number
  label: string
}

export interface TrimInput {
  edge: 'left' | 'right'
  deltaFrames: number
  originStartFrame: number
  originDuration: number
  originTrimStart: number
  originTrimEnd: number
  speed: number
  sourceFrames: number
  type: TrackType
  /* Earliest start / latest end allowed by neighbouring clips on the track. */
  minStartFrame: number
  maxEndFrame: number
}

export interface TrimResult {
  startFrame: number
  durationInFrames: number
  trimStartFrame: number
  trimEndFrame: number
}

export interface TrimState {
  edge: 'left' | 'right'
  clipId: string
  startClientX: number
  originStartFrame: number
  originDuration: number
  originTrimStart: number
  originTrimEnd: number
  speed: number
  sourceFrames: number
  type: TrackType
  minStartFrame: number
  maxEndFrame: number
}

// ============================================================================
// Factory
// ============================================================================

export interface CreateClipArgs {
  media: MediaAsset
  trackId: string
  startFrame: number
  fps: number
  id?: string
}

// ============================================================================
// Component props
// ============================================================================

export interface KeyframeRowProps {
  keyframe: Keyframe
  maxFrame: number
  onChange: (changes: Partial<Keyframe>) => void
  onRemove: () => void
}

export interface ClipBlockProps {
  clip: Clip
  media?: MediaAsset
  pixelsPerFrame: number
  isSelected: boolean
  onSelect: (clipId: string) => void
  onTrimStart: (
    event: ReactPointerEvent,
    clip: Clip,
    edge: 'left' | 'right',
  ) => void
}

export interface ClipRendererProps {
  clip: Clip
  media: MediaAsset
  renderMode: RenderMode
}

export interface ReversedVideoProps {
  clip: Clip
  media: MediaAsset
  style: CSSProperties
}

export interface SegmentOption<T extends string | number> {
  label: string
  value: T
}

export type IconProps = SVGProps<SVGSVGElement>
