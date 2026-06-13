import { useSelector } from 'react-redux'
import { useAppDispatch } from '../../store/hooks'
import { selectThemeMode } from '../../store/selectors'
import { toggleTheme } from '../../store/slices/themeSlice'
import { MoonIcon, SunIcon } from '../icons'

export function Header() {
  const dispatch = useAppDispatch()
  const themeMode = useSelector(selectThemeMode)

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
    </header>
  )
}
