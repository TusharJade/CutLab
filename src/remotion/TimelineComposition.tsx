import { AbsoluteFill, Sequence } from 'remotion'
import type { TimelineCompositionProps } from '../utils/types'
import { ClipRenderer } from './ClipRenderer'

export function TimelineComposition({
  tracks,
  clips,
  media,
  backgroundColor,
  renderMode = 'preview',
}: TimelineCompositionProps) {
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
