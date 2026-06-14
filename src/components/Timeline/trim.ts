import type { TrimInput, TrimResult } from '../../utils/types'

/**
 * Computes the new clip bounds while dragging a trim handle. Images have no
 * source frames to clamp against, so their trim simply tracks the duration.
 */
export function computeTrim(input: TrimInput): TrimResult {
  const {
    edge,
    deltaFrames,
    originStartFrame,
    originDuration,
    originTrimStart,
    originTrimEnd,
    speed,
    sourceFrames,
    type,
    minStartFrame,
    maxEndFrame,
  } = input

  const isImage = type === 'image'
  const maxSourceFrames = sourceFrames || Number.MAX_SAFE_INTEGER

  if (edge === 'left') {
    const maxShift = originDuration - 1
    // Lower bound keeps the clip from sliding into a left neighbour.
    const shift = Math.min(
      maxShift,
      Math.max(minStartFrame - originStartFrame, deltaFrames),
    )
    const durationInFrames = originDuration - shift
    return {
      startFrame: originStartFrame + shift,
      durationInFrames,
      trimStartFrame: isImage
        ? 0
        : Math.min(
            originTrimEnd - 1,
            Math.max(0, originTrimStart + shift * speed),
          ),
      trimEndFrame: isImage ? durationInFrames : originTrimEnd,
    }
  }

  const maxDurationFromSource = isImage
    ? Number.MAX_SAFE_INTEGER
    : Math.floor((maxSourceFrames - originTrimStart) / speed)
  // Upper bound keeps the clip from growing into a right neighbour.
  const maxDurationFromNeighbour = maxEndFrame - originStartFrame
  const durationInFrames = Math.max(
    1,
    Math.min(
      originDuration + deltaFrames,
      maxDurationFromSource,
      maxDurationFromNeighbour,
    ),
  )
  return {
    startFrame: originStartFrame,
    durationInFrames,
    trimStartFrame: originTrimStart,
    trimEndFrame: isImage
      ? durationInFrames
      : Math.min(maxSourceFrames, originTrimStart + durationInFrames * speed),
  }
}
