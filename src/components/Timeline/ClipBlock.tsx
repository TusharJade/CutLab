import type { PointerEvent as ReactPointerEvent } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Clip, MediaAsset } from '../../types'
import { TRACK_COLOR_VAR } from './timelineConstants'

interface ClipBlockProps {
  clip: Clip
  media?: MediaAsset
  pixelsPerFrame: number
  isSelected: boolean
  onSelect: (clipId: string) => void
  onTrimStart: (event: ReactPointerEvent, clip: Clip, edge: 'left' | 'right') => void
}

export function ClipBlock({
  clip,
  media,
  pixelsPerFrame,
  isSelected,
  onSelect,
  onTrimStart,
}: ClipBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: clip.id, data: { clip } })

  const left = clip.startFrame * pixelsPerFrame
  const width = Math.max(8, clip.durationInFrames * pixelsPerFrame)
  const color = TRACK_COLOR_VAR[clip.type]

  const isAudio = clip.type === 'audio'
  const hasFilmstrip = !isAudio && Boolean(media?.thumbnailUrl)

  const handleClass = isSelected
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100'

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelect(clip.id)}
      {...listeners}
      {...attributes}
      className={`group absolute top-1 bottom-1 cursor-grab touch-none overflow-hidden rounded-md border text-left active:cursor-grabbing ${
        isSelected ? 'ring-2 ring-clip-selected' : ''
      } ${isDragging ? 'z-30 opacity-80 shadow-lg' : ''}`}
      style={{
        left,
        width,
        backgroundColor: color,
        borderColor: 'var(--clip-border)',
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      {hasFilmstrip && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${media!.thumbnailUrl})`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'left center',
          }}
        />
      )}
      {isAudio && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, var(--waveform) 0 2px, transparent 2px 5px)',
            backgroundPosition: 'center',
            backgroundSize: '100% 40%',
            backgroundRepeat: 'repeat-x',
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-linear-to-b from-black/55 to-transparent" />

      <div className="pointer-events-none relative flex h-full flex-col justify-between p-1">
        <span className="max-w-full self-start truncate rounded bg-black/45 px-1 text-xxs font-medium text-white">
          {media?.name ?? clip.type}
        </span>
        <div className="flex flex-wrap gap-1">
          {clip.reverse && (
            <span className="rounded bg-black/55 px-1 text-xxs text-white">
              REV
            </span>
          )}
          {clip.speed !== 1 && (
            <span className="rounded bg-black/55 px-1 text-xxs text-white">
              {clip.speed}x
            </span>
          )}
          {clip.muted && (
            <span className="rounded bg-black/55 px-1 text-xxs text-white">
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
        className={`absolute inset-y-0 left-0 flex w-2 cursor-ew-resize items-center justify-center bg-black/35 transition-opacity ${handleClass}`}
      >
        <span className="h-5 w-0.5 rounded-full bg-white/80" />
      </div>
      <div
        onPointerDown={(event) => {
          event.stopPropagation()
          onSelect(clip.id)
          onTrimStart(event, clip, 'right')
        }}
        className={`absolute inset-y-0 right-0 flex w-2 cursor-ew-resize items-center justify-center bg-black/35 transition-opacity ${handleClass}`}
      >
        <span className="h-5 w-0.5 rounded-full bg-white/80" />
      </div>
    </div>
  )
}
