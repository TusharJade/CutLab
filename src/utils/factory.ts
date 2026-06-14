import type { Clip, ClipTransform, CreateClipArgs, MediaAsset, TrackType } from './types'
import { DEFAULT_IMAGE_DURATION_SECONDS } from './constants'
import { createId } from './id'

export function createDefaultTransform(): ClipTransform {
  return {
    translateX: 0,
    translateY: 0,
    scale: 1,
    padding: 0,
    paddingColor: '#000000',
    crop: { x: 0, y: 0, width: 1, height: 1 },
  }
}

export function mediaTypeToTrackType(type: MediaAsset['type']): TrackType {
  return type
}

export function createClipFromMedia({
  media,
  trackId,
  startFrame,
  fps,
  id,
}: CreateClipArgs): Clip {
  const sourceDuration =
    media.type === 'image'
      ? DEFAULT_IMAGE_DURATION_SECONDS
      : media.naturalDurationSeconds
  const durationInFrames = Math.max(1, Math.round(sourceDuration * fps))

  return {
    id: id ?? createId('clip'),
    mediaId: media.id,
    type: mediaTypeToTrackType(media.type),
    trackId,
    startFrame,
    durationInFrames,
    trimStartFrame: 0,
    trimEndFrame: durationInFrames,
    speed: 1,
    reverse: false,
    volume: 1,
    muted: false,
    fadeInFrames: 0,
    fadeOutFrames: 0,
    transform: createDefaultTransform(),
    keyframes: [],
  }
}
