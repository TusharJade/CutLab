export function framesToTimecode(frames: number, fps: number): string {
  const totalSeconds = frames / fps
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const remainderFrames = Math.floor(frames % fps)
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${pad(minutes)}:${pad(seconds)}:${pad(remainderFrames)}`
}

export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}
