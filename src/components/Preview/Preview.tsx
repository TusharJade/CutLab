import { useEffect, useRef } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { useDispatch, useSelector } from 'react-redux'
import { TimelineComposition } from '../../remotion/TimelineComposition'
import type { AppDispatch, RootState } from '../../store/store'
import { setIsPlaying, setPlayheadFrame } from '../../store/slices/editorSlice'
import { useCompositionProps } from '../../hooks/useCompositionProps'
import { framesToTimecode } from '../../utils/format'
import { PauseIcon, PlayIcon } from '../icons'

const selectClips = (state: RootState) => state.project.clips
const selectPlayheadFrame = (state: RootState) => state.editor.playheadFrame
const selectIsPlaying = (state: RootState) => state.editor.isPlaying

export function Preview() {
  const dispatch = useDispatch<AppDispatch>()
  const clips = useSelector(selectClips)
  const playheadFrame = useSelector(selectPlayheadFrame)
  const isPlaying = useSelector(selectIsPlaying)
  const { inputProps, durationInFrames, width, height, fps } =
    useCompositionProps()

  const playerRef = useRef<PlayerRef>(null)

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) {
      player.play()
    } else {
      player.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    const current = player.getCurrentFrame()
    if (Math.abs(current - playheadFrame) > 1) {
      player.seekTo(playheadFrame)
    }
  }, [playheadFrame])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const handleFrameUpdate = (event: { detail: { frame: number } }) => {
      dispatch(setPlayheadFrame(event.detail.frame))
    }
    const handlePlay = () => dispatch(setIsPlaying(true))
    const handlePause = () => dispatch(setIsPlaying(false))

    player.addEventListener('frameupdate', handleFrameUpdate)
    player.addEventListener('play', handlePlay)
    player.addEventListener('pause', handlePause)
    player.addEventListener('ended', handlePause)

    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate)
      player.removeEventListener('play', handlePlay)
      player.removeEventListener('pause', handlePause)
      player.removeEventListener('ended', handlePause)
    }
  }, [dispatch])

  const hasContent = Object.keys(clips).length > 0

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-canvas">
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-6">
        <div
          className="relative"
          style={{
            aspectRatio: `${width} / ${height}`,
            height: '100%',
            maxWidth: '100%',
          }}
        >
          <Player
            ref={playerRef}
            component={TimelineComposition}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            compositionWidth={width}
            compositionHeight={height}
            fps={fps}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            acknowledgeRemotionLicense
          />
          {!hasContent && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
              <p className="text-sm text-muted">No clips on the timeline</p>
              <p className="mt-1 text-xs text-muted-2">
                Upload media and click it to place it
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-12 shrink-0 items-center justify-center gap-4 border-t border-border bg-panel px-4">
        <button
          type="button"
          onClick={() => dispatch(setIsPlaying(!isPlaying))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-fg transition-colors hover:bg-primary-hover"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <PauseIcon width={16} height={16} />
          ) : (
            <PlayIcon width={16} height={16} />
          )}
        </button>
        <div className="flex items-center gap-1 font-mono text-sm tabular-nums">
          <span className="text-fg">{framesToTimecode(playheadFrame, fps)}</span>
          <span className="text-muted-2">/</span>
          <span className="text-muted">
            {framesToTimecode(durationInFrames, fps)}
          </span>
        </div>
      </div>
    </section>
  )
}
