import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../../store/hooks'
import { selectClips, selectThemeMode } from '../../store/selectors'
import { toggleTheme } from '../../store/slices/themeSlice'
import { useCompositionProps } from '../../hooks/useCompositionProps'
import { exportProjectToMp4 } from '../../utils/export'
import { DownloadIcon, MoonIcon, SpinnerIcon, SunIcon } from '../icons'

export function Header() {
  const dispatch = useAppDispatch()
  const themeMode = useSelector(selectThemeMode)
  const clips = useSelector(selectClips)
  const composition = useCompositionProps()

  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportError, setExportError] = useState<string | null>(null)

  const hasContent = Object.keys(clips).length > 0

  const handleExport = async () => {
    if (isExporting || !hasContent) return
    setIsExporting(true)
    setProgress(0)
    setExportError(null)
    try {
      await exportProjectToMp4({
        inputProps: composition.inputProps,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        onProgress: (ratio) => setProgress(ratio),
      })
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Export failed',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-panel px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-fg">
          <span className="text-md font-bold">C</span>
        </div>
        <span className="text-base font-semibold tracking-tight">CutLab</span>
        <span className="ml-2 rounded bg-panel-2 px-2 py-0.5 text-xxs uppercase tracking-wider text-muted">
          Editor
        </span>
      </div>

      <div className="flex items-center gap-2">
        {exportError && (
          <span
            className="max-w-48 truncate text-xxs text-danger"
            title={exportError}
          >
            {exportError}
          </span>
        )}
        <button
          type="button"
          onClick={handleExport}
          disabled={!hasContent || isExporting}
          className="flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <SpinnerIcon width={14} height={14} />
              <span className="tabular-nums">
                {Math.round(progress * 100)}%
              </span>
            </>
          ) : (
            <>
              <DownloadIcon width={14} height={14} />
              <span>Export</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          className="flex h-8 items-center gap-2 rounded-md border border-border bg-panel-2 px-3 text-sm text-fg transition-colors hover:border-border-strong hover:bg-panel-3"
          aria-label="Toggle theme"
        >
          {themeMode === 'dark' ? (
            <SunIcon width={14} height={14} />
          ) : (
            <MoonIcon width={14} height={14} />
          )}
          <span className="capitalize">{themeMode}</span>
        </button>
      </div>
    </header>
  )
}
