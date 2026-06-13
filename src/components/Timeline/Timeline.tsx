import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../../store/hooks'
import {
  selectClips,
  selectFps,
  selectMediaAssets,
  selectPixelsPerFrame,
  selectPlayheadFrame,
  selectProjectDurationInFrames,
  selectSelectedClipId,
  selectTracks,
} from '../../store/selectors'
import {
  selectClip,
  setPlayheadFrame,
  zoomIn,
  zoomOut,
} from '../../store/slices/editorSlice'
import { moveClip, moveTrack, removeTrack, trimClip } from '../../store/slices/projectSlice'
import type { Clip, MediaAsset, TrackType } from '../../types'
import { TrashIcon, ZoomInIcon, ZoomOutIcon } from '../icons'
import { ClipBlock } from './ClipBlock'
import { buildTicks } from './ticks'
import {
  LABEL_WIDTH,
  RULER_HEIGHT,
  TRACK_COLOR_VAR,
  TRACK_HEIGHT,
} from './timelineConstants'

interface DragState {
  mode: 'move' | 'trim'
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
}

export function Timeline() {
  const dispatch = useAppDispatch()
  const tracks = useSelector(selectTracks)
  const clips = useSelector(selectClips)
  const assets = useSelector(selectMediaAssets)
  const fps = useSelector(selectFps)
  const pixelsPerFrame = useSelector(selectPixelsPerFrame)
  const playheadFrame = useSelector(selectPlayheadFrame)
  const selectedClipId = useSelector(selectSelectedClipId)
  const projectDuration = useSelector(selectProjectDurationInFrames)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const mediaRecord = useMemo(() => {
    return assets.reduce<Record<string, MediaAsset>>((record, asset) => {
      record[asset.id] = asset
      return record
    }, {})
  }, [assets])

  const contentFrames = projectDuration + fps * 3
  const contentWidth = contentFrames * pixelsPerFrame
  const ticks = useMemo(
    () => buildTicks(contentFrames, fps, pixelsPerFrame),
    [contentFrames, fps, pixelsPerFrame],
  )

  function frameFromClientX(clientX: number): number {
    const container = scrollRef.current
    if (!container) return 0
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left + container.scrollLeft - LABEL_WIDTH
    return Math.max(0, Math.round(x / pixelsPerFrame))
  }

  function handleRulerPointerDown(event: ReactPointerEvent) {
    dispatch(setPlayheadFrame(frameFromClientX(event.clientX)))
    const move = (moveEvent: PointerEvent) => {
      dispatch(setPlayheadFrame(frameFromClientX(moveEvent.clientX)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function beginMove(event: ReactPointerEvent, clip: Clip) {
    const media = mediaRecord[clip.mediaId]
    setDragState({
      mode: 'move',
      edge: 'left',
      clipId: clip.id,
      startClientX: event.clientX,
      originStartFrame: clip.startFrame,
      originDuration: clip.durationInFrames,
      originTrimStart: clip.trimStartFrame,
      originTrimEnd: clip.trimEndFrame,
      speed: clip.speed,
      sourceFrames: media ? Math.floor(media.naturalDurationSeconds * fps) : 0,
      type: clip.type,
    })
  }

  function beginTrim(event: ReactPointerEvent, clip: Clip, edge: 'left' | 'right') {
    const media = mediaRecord[clip.mediaId]
    setDragState({
      mode: 'trim',
      edge,
      clipId: clip.id,
      startClientX: event.clientX,
      originStartFrame: clip.startFrame,
      originDuration: clip.durationInFrames,
      originTrimStart: clip.trimStartFrame,
      originTrimEnd: clip.trimEndFrame,
      speed: clip.speed,
      sourceFrames: media ? Math.floor(media.naturalDurationSeconds * fps) : 0,
      type: clip.type,
    })
  }

  useEffect(() => {
    if (!dragState) return

    function handlePointerMove(event: PointerEvent) {
      if (!dragState) return
      const deltaFrames = Math.round(
        (event.clientX - dragState.startClientX) / pixelsPerFrame,
      )

      if (dragState.mode === 'move') {
        const startFrame = Math.max(0, dragState.originStartFrame + deltaFrames)
        dispatch(moveClip({ clipId: dragState.clipId, startFrame }))
        return
      }

      const isImage = dragState.type === 'image'
      const maxSourceFrames = dragState.sourceFrames || Number.MAX_SAFE_INTEGER

      if (dragState.edge === 'left') {
        const maxShift = dragState.originDuration - 1
        const shift = Math.min(
          maxShift,
          Math.max(-dragState.originStartFrame, deltaFrames),
        )
        const startFrame = dragState.originStartFrame + shift
        const durationInFrames = dragState.originDuration - shift
        const trimStartFrame = isImage
          ? 0
          : Math.min(
              dragState.originTrimEnd - 1,
              Math.max(0, dragState.originTrimStart + shift * dragState.speed),
            )
        const trimEndFrame = isImage ? durationInFrames : dragState.originTrimEnd
        dispatch(
          trimClip({
            clipId: dragState.clipId,
            startFrame,
            durationInFrames,
            trimStartFrame,
            trimEndFrame,
          }),
        )
        return
      }

      // Right edge
      const maxDurationFromSource = isImage
        ? Number.MAX_SAFE_INTEGER
        : Math.floor(
            (maxSourceFrames - dragState.originTrimStart) / dragState.speed,
          )
      const durationInFrames = Math.max(
        1,
        Math.min(dragState.originDuration + deltaFrames, maxDurationFromSource),
      )
      const trimEndFrame = isImage
        ? durationInFrames
        : Math.min(
            maxSourceFrames,
            dragState.originTrimStart + durationInFrames * dragState.speed,
          )
      dispatch(
        trimClip({
          clipId: dragState.clipId,
          startFrame: dragState.originStartFrame,
          durationInFrames,
          trimStartFrame: dragState.originTrimStart,
          trimEndFrame,
        }),
      )
    }

    function handlePointerUp() {
      setDragState(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragState, pixelsPerFrame, dispatch])

  return (
    <section className="flex h-72 shrink-0 flex-col border-t border-border bg-panel">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted">
          Timeline
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => dispatch(zoomOut())}
            className="flex h-7 w-7 items-center justify-center rounded border border-border bg-panel-2 text-muted transition-colors hover:text-fg"
            aria-label="Zoom out"
          >
            <ZoomOutIcon width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={() => dispatch(zoomIn())}
            className="flex h-7 w-7 items-center justify-center rounded border border-border bg-panel-2 text-muted transition-colors hover:text-fg"
            aria-label="Zoom in"
          >
            <ZoomInIcon width={14} height={14} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto">
        <div style={{ width: LABEL_WIDTH + contentWidth, minWidth: '100%' }}>
          {/* Ruler */}
          <div
            className="sticky top-0 z-20 flex"
            style={{ height: RULER_HEIGHT }}
          >
            <div
              className="sticky left-0 z-30 shrink-0 border-b border-r border-border bg-panel"
              style={{ width: LABEL_WIDTH, height: RULER_HEIGHT }}
            />
            <div
              className="relative cursor-text border-b border-border bg-panel"
              style={{ width: contentWidth, height: RULER_HEIGHT }}
              onPointerDown={handleRulerPointerDown}
            >
              {ticks.map((tick) => (
                <div
                  key={tick.frame}
                  className="absolute top-0 flex h-full items-center"
                  style={{ left: tick.frame * pixelsPerFrame }}
                >
                  <div className="h-2 w-px bg-border-strong" />
                  <span className="ml-1 text-xxs text-muted-2">{tick.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          {tracks.length === 0 ? (
            <div
              className="flex items-center justify-center text-xs text-muted-2"
              style={{ height: TRACK_HEIGHT * 2 }}
            >
              Add media from the library to create tracks.
            </div>
          ) : (
            tracks.map((track, index) => (
              <div key={track.id} className="flex" style={{ height: TRACK_HEIGHT }}>
                <div
                  className="sticky left-0 z-10 flex shrink-0 flex-col justify-center gap-1 border-b border-r border-border bg-panel px-2"
                  style={{ width: LABEL_WIDTH }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: TRACK_COLOR_VAR[track.type] }}
                    />
                    <span className="truncate text-xs font-medium">
                      {track.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => dispatch(moveTrack({ trackId: track.id, direction: 'up' }))}
                      disabled={index === 0}
                      className="text-xxs text-muted-2 transition-colors hover:text-fg disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(moveTrack({ trackId: track.id, direction: 'down' }))}
                      disabled={index === tracks.length - 1}
                      className="text-xxs text-muted-2 transition-colors hover:text-fg disabled:opacity-30"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(removeTrack(track.id))}
                      className="ml-auto text-muted-2 transition-colors hover:text-danger"
                      aria-label="Remove track"
                    >
                      <TrashIcon width={12} height={12} />
                    </button>
                  </div>
                </div>
                <div
                  className="relative border-b border-border"
                  style={{ width: contentWidth, backgroundColor: 'var(--panel-2)' }}
                  onPointerDown={(event) => {
                    if (event.target === event.currentTarget) {
                      dispatch(selectClip(null))
                    }
                  }}
                >
                  {track.clipIds.map((clipId) => {
                    const clip = clips[clipId]
                    if (!clip) return null
                    return (
                      <ClipBlock
                        key={clip.id}
                        clip={clip}
                        media={mediaRecord[clip.mediaId]}
                        pixelsPerFrame={pixelsPerFrame}
                        isSelected={clip.id === selectedClipId}
                        onSelect={(id) => dispatch(selectClip(id))}
                        onMoveStart={beginMove}
                        onTrimStart={beginTrim}
                      />
                    )
                  })}
                </div>
              </div>
            ))
          )}

          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-0 z-30 w-px"
            style={{
              left: LABEL_WIDTH + playheadFrame * pixelsPerFrame,
              height: '100%',
              backgroundColor: 'var(--playhead)',
            }}
          >
            <div
              className="absolute -left-1 top-0 h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--playhead)' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
