export type MediaType = 'video' | 'audio' | 'image'

export type TrackType = 'video' | 'audio' | 'image' | 'text'

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

export interface Project {
  fps: number
  width: number
  height: number
  tracks: Track[]
}

export type ThemeMode = 'dark' | 'light'
