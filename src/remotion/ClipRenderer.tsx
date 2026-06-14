import {
  AbsoluteFill,
  Audio as HtmlAudio,
  Img,
  Video as HtmlVideo,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { Audio as MediaAudio, Video as MediaVideo } from '@remotion/media'
import type { Clip, MediaAsset } from '../types'
import type { RenderMode } from './Main'
import { resolveKeyframeProps } from './interpolateKeyframes'
import { ReversedVideo } from './ReversedVideo'

interface ClipRendererProps {
  clip: Clip
  media: MediaAsset
  renderMode: RenderMode
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

function VisualClip({ clip, media, renderMode }: ClipRendererProps) {
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
              <ForwardOrReverseVideo
                clip={clip}
                media={media}
                renderMode={renderMode}
                style={mediaStyle}
              />
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
  renderMode,
  style,
}: ClipRendererProps & { style: React.CSSProperties }) {
  const localFrame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sourceFrames = Math.max(
    1,
    Math.floor(media.naturalDurationSeconds * fps),
  )
  const volume = clip.muted ? 0 : clip.volume
  const isPreview = renderMode === 'preview'

  // Remotion's native <Video> builds its trim window as `from = -trimBefore`
  // but `durationInFrames = trimAfter / playbackRate`, scaling only trimAfter.
  // To keep the window aligned when speed != 1 (e.g. after a split), pre-divide
  // trimBefore by the speed for the native preview component. @remotion/media
  // (export) interprets trim in source frames, so it keeps the raw value.
  const previewTrimBefore = Math.round(clip.trimStartFrame / clip.speed)

  if (!clip.reverse) {
    // Preview uses the browser-native video element so playbackRate (e.g. 2x)
    // stays smooth; export uses @remotion/media which the web-renderer supports.
    if (isPreview) {
      return (
        <HtmlVideo
          src={media.objectUrl}
          trimBefore={previewTrimBefore}
          trimAfter={clip.trimEndFrame}
          playbackRate={clip.speed}
          volume={volume}
          style={{ ...style, objectFit: 'cover' }}
        />
      )
    }
    return (
      <MediaVideo
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

  // Preview draws pre-decoded frames from the in-memory cache so reverse stays
  // smooth (no per-frame backward seek/decode, which buffers or black-flashes).
  if (isPreview) {
    // Remount when the cached signature changes so frame state resets cleanly.
    const reverseKey = `${media.id}:${media.objectUrl}:${clip.trimStartFrame}:${clip.trimEndFrame}:${clip.speed}:${clip.durationInFrames}`
    return (
      <ReversedVideo key={reverseKey} clip={clip} media={media} style={style} />
    )
  }

  // Export keeps the frame-accurate path: seek the decoder per frame. This is
  // offline so the per-frame decode cost is acceptable. playbackRate stays 1,
  // so trimBefore matches the export interpretation.
  const reverseSourceFrame = clip.trimEndFrame - 1 - localFrame * clip.speed
  const trimBefore = Math.max(
    0,
    Math.min(sourceFrames - 1, Math.round(reverseSourceFrame - localFrame)),
  )
  return (
    <MediaVideo
      src={media.objectUrl}
      trimBefore={trimBefore}
      volume={volume}
      objectFit="cover"
      style={style}
    />
  )
}

function AudioClip({ clip, media, renderMode }: ClipRendererProps) {
  const volume = clip.muted ? 0 : clip.volume
  const isPreview = renderMode === 'preview'
  const AudioTag = isPreview ? HtmlAudio : MediaAudio
  // See VisualClip: the native preview component needs trimBefore pre-divided
  // by speed so the trim window stays aligned when speed != 1.
  const trimBefore = isPreview
    ? Math.round(clip.trimStartFrame / clip.speed)
    : clip.trimStartFrame
  return (
    <AudioTag
      src={media.objectUrl}
      trimBefore={trimBefore}
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

export function ClipRenderer({ clip, media, renderMode }: ClipRendererProps) {
  if (clip.type === 'audio') {
    return <AudioClip clip={clip} media={media} renderMode={renderMode} />
  }
  return <VisualClip clip={clip} media={media} renderMode={renderMode} />
}
