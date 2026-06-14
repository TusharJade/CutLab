import { renderMediaOnWeb } from '@remotion/web-renderer'
import { TimelineComposition } from '../remotion/TimelineComposition'
import type { ExportArgs, TimelineCompositionProps } from './types'

export async function exportProjectToMp4({
  inputProps,
  width,
  height,
  fps,
  durationInFrames,
  onProgress,
  signal,
}: ExportArgs): Promise<void> {
  const exportProps: TimelineCompositionProps = {
    ...inputProps,
    renderMode: 'export',
  }
  const result = await renderMediaOnWeb({
    composition: {
      component: TimelineComposition,
      id: 'cutlab',
      width,
      height,
      fps,
      durationInFrames,
      defaultProps: exportProps,
    },
    inputProps: exportProps,
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
