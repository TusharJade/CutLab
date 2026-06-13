import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Clip, MediaAsset } from '../../types'
import { TRACK_COLOR_VAR } from './timelineConstants'

interface ClipBlockProps {
  clip: Clip
  media?: MediaAsset
  pixelsPerFrame: number
  isSelected: boolean
  onSelect: (clipId: string) => void
  onMoveStart: (event: ReactPointerEvent, clip: Clip) => void
  onTrimStart: (event: ReactPointerEvent, clip: Clip, edge: 'left' | 'right') => void
}

export function ClipBlock({
  clip,
  media,
  pixelsPerFrame,
  isSelected,
  onSelect,
  onMoveStart,
  onTrimStart,
}: ClipBlockProps) {
  const left = clip.startFrame * pixelsPerFrame
  const width = Math.max(8, clip.durationInFrames * pixelsPerFrame)
  const color = TRACK_COLOR_VAR[clip.type]

  const isAudio = clip.type === 'audio'

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(event) => {
        onSelect(clip.id)
        onMoveStart(event, clip)
      }}
      className={`group absolute top-1 bottom-1 overflow-hidden rounded-md border text-left ${
        isSelected ? 'ring-2 ring-clip-selected' : ''
      }`}
      style={{
        left,
        width,
        backgroundColor: color,
        borderColor: 'var(--clip-border)',
      }}
    >
      <div
        className="pointer-events-none flex h-full flex-col justify-between p-1"
        style={
          isAudio
            ? {
                backgroundImage:
                  'repeating-linear-gradient(90deg, var(--waveform) 0 2px, transparent 2px 5px)',
                backgroundPosition: 'center',
                backgroundSize: '100% 40%',
                backgroundRepeat: 'repeat-x',
              }
            : undefined
        }
      >
        <div className="flex items-center gap-1">
          {media?.thumbnailUrl && !isAudio && (
            <img
              src={media.thumbnailUrl}
              alt=""
              className="h-4 w-6 rounded-sm object-cover"
            />
          )}
          <span className="truncate text-xxs font-medium text-white/90">
            {media?.name ?? clip.type}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {clip.reverse && (
            <span className="rounded bg-black/40 px-1 text-xxs text-white">
              REV
            </span>
          )}
          {clip.speed !== 1 && (
            <span className="rounded bg-black/40 px-1 text-xxs text-white">
              {clip.speed}x
            </span>
          )}
          {clip.muted && (
            <span className="rounded bg-black/40 px-1 text-xxs text-white">
              MUTE
            </span>
          )}
        </div>
      </div>

      <div
        onPointerDown={(event) => {
          event.stopPropagation()
          onSelect(clip.id)
          onTrimStart(event, clip, 'left')
        }}
        className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <div
        onPointerDown={(event) => {
          event.stopPropagation()
          onSelect(clip.id)
          onTrimStart(event, clip, 'right')
        }}
        className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  )
}
