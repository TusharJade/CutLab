import { renderMediaOnWeb } from '@remotion/web-renderer'
import { Main, type MainProps } from '../remotion/Main'

interface ExportArgs {
  inputProps: MainProps
  width: number
  height: number
  fps: number
  durationInFrames: number
  onProgress?: (ratio: number) => void
  signal?: AbortSignal
}

export async function exportProjectToMp4({
  inputProps,
  width,
  height,
  fps,
  durationInFrames,
  onProgress,
  signal,
}: ExportArgs): Promise<void> {
  const result = await renderMediaOnWeb({
    composition: {
      component: Main,
      id: 'cutlab',
      width,
      height,
      fps,
      durationInFrames,
      defaultProps: inputProps,
    },
    inputProps,
    container: 'mp4',
    videoCodec: 'h264',
    onProgress: onProgress
      ? (progress) => onProgress(progress.progress)
      : null,
    signal: signal ?? null,
  })

  const blob = await result.getBlob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `cutlab-export-${Date.now()}.mp4`
  anchor.click()
  URL.revokeObjectURL(url)
}
