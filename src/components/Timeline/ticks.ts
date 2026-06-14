import type { Tick } from '../../utils/types'
import {
  MIN_TICK_SPACING_PX,
  TICK_SECONDS_CANDIDATES,
} from '../../utils/constants'

export function buildTicks(
  totalFrames: number,
  fps: number,
  pixelsPerFrame: number,
): Tick[] {
  const pixelsPerSecond = pixelsPerFrame * fps
  const tickSeconds =
    TICK_SECONDS_CANDIDATES.find(
      (seconds) => seconds * pixelsPerSecond >= MIN_TICK_SPACING_PX,
    ) ?? 600

  const ticks: Tick[] = []
  const totalSeconds = totalFrames / fps
  for (let seconds = 0; seconds <= totalSeconds; seconds += tickSeconds) {
    ticks.push({ frame: seconds * fps, label: `${seconds}s` })
  }
  return ticks
}
