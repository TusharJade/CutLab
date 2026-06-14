import { AbsoluteFill, Sequence } from 'remotion'
import type { Clip, MediaAsset, Track } from '../types'
import { ClipRenderer } from './ClipRenderer'

export type RenderMode = 'preview' | 'export'

export type MainProps = {
  tracks: Track[]
  clips: Record<string, Clip>
  media: Record<string, MediaAsset>
  backgroundColor: string
  renderMode?: RenderMode
}

export function Main({
  tracks,
  clips,
  media,
  backgroundColor,
  renderMode = 'preview',
}: MainProps) {
  // Render last track first so the topmost timeline track paints on top.
  const orderedTracks = [...tracks].reverse()

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {orderedTracks.map((track) =>
        track.clipIds.map((clipId) => {
          const clip = clips[clipId]
          if (!clip) return null
          const asset = media[clip.mediaId]
          if (!asset) return null
          return (
            <Sequence
              key={clip.id}
              from={clip.startFrame}
              durationInFrames={clip.durationInFrames}
              layout="none"
            >
              <ClipRenderer
                clip={clip}
                media={asset}
                renderMode={renderMode}
              />
            </Sequence>
          )
        }),
      )}
    </AbsoluteFill>
  )
}
