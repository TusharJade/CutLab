import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { Audio, Video } from '@remotion/media'
import type { Clip, MediaAsset } from '../types'
import { resolveKeyframeProps } from './interpolateKeyframes'

interface ClipRendererProps {
  clip: Clip
  media: MediaAsset
}

function fadeMultiplier(
  localFrame: number,
  duration: number,
  fadeIn: number,
  fadeOut: number,
): number {
  let value = 1
  if (fadeIn > 0 && localFrame < fadeIn) {
    value = Math.min(value, localFrame / fadeIn)
  }
  if (fadeOut > 0 && localFrame > duration - fadeOut) {
    value = Math.min(value, Math.max(0, (duration - localFrame) / fadeOut))
  }
  return Math.max(0, Math.min(1, value))
}

function VisualClip({ clip, media }: ClipRendererProps) {
  const localFrame = useCurrentFrame()
  const { crop, padding, paddingColor } = clip.transform

  const resolved = resolveKeyframeProps(localFrame, clip.keyframes, {
    scale: clip.transform.scale,
    translateX: clip.transform.translateX,
    translateY: clip.transform.translateY,
    opacity: 1,
  })

  const fade = fadeMultiplier(
    localFrame,
    clip.durationInFrames,
    clip.fadeInFrames,
    clip.fadeOutFrames,
  )

  const cropWidth = Math.max(0.01, crop.width)
  const cropHeight = Math.max(0.01, crop.height)

  const mediaStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${100 / cropWidth}%`,
    height: `${100 / cropHeight}%`,
    left: `${(-crop.x / cropWidth) * 100}%`,
    top: `${(-crop.y / cropHeight) * 100}%`,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: padding > 0 ? paddingColor : 'transparent' }}>
      <div
        style={{
          position: 'absolute',
          inset: padding,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: resolved.opacity * fade,
            transform: `translate(${resolved.translateX}px, ${resolved.translateY}px) scale(${resolved.scale})`,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {clip.type === 'image' ? (
              <Img
                src={media.objectUrl}
                style={{ ...mediaStyle, objectFit: 'cover' }}
              />
            ) : (
              <ForwardOrReverseVideo clip={clip} media={media} style={mediaStyle} />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function ForwardOrReverseVideo({
  clip,
  media,
  style,
}: ClipRendererProps & { style: React.CSSProperties }) {
  const localFrame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sourceFrames = Math.max(
    1,
    Math.floor(media.naturalDurationSeconds * fps),
  )
  const volume = clip.muted ? 0 : clip.volume

  if (!clip.reverse) {
    return (
      <Video
        src={media.objectUrl}
        trimBefore={clip.trimStartFrame}
        trimAfter={clip.trimEndFrame}
        playbackRate={clip.speed}
        volume={volume}
        objectFit="cover"
        style={style}
      />
    )
  }

  const reverseSourceFrame = clip.trimEndFrame - 1 - localFrame * clip.speed
  const trimBefore = Math.max(
    0,
    Math.min(sourceFrames - 1, Math.round(reverseSourceFrame - localFrame)),
  )

  return (
    <Video
      src={media.objectUrl}
      trimBefore={trimBefore}
      volume={volume}
      objectFit="cover"
      style={style}
    />
  )
}

function AudioClip({ clip, media }: ClipRendererProps) {
  const volume = clip.muted ? 0 : clip.volume
  return (
    <Audio
      src={media.objectUrl}
      trimBefore={clip.trimStartFrame}
      trimAfter={clip.trimEndFrame}
      playbackRate={clip.speed}
      volume={(frame) =>
        volume *
        fadeMultiplier(
          frame,
          clip.durationInFrames,
          clip.fadeInFrames,
          clip.fadeOutFrames,
        )
      }
    />
  )
}

export function ClipRenderer({ clip, media }: ClipRendererProps) {
  if (clip.type === 'audio') {
    return <AudioClip clip={clip} media={media} />
  }
  return <VisualClip clip={clip} media={media} />
}
