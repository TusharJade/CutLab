import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Header } from './components/Header/Header'
import { MediaLibrary } from './components/MediaLibrary/MediaLibrary'
import { Preview } from './components/Preview/Preview'
import { Inspector } from './components/Inspector/Inspector'
import { Timeline } from './components/Timeline/Timeline'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { selectThemeMode } from './store/selectors'

function App() {
  const themeMode = useSelector(selectThemeMode)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(themeMode)
  }, [themeMode])

  useKeyboardShortcuts()

  return (
    <div className="flex h-full flex-col bg-canvas text-fg">
      <Header />
      <div className="flex min-h-0 flex-1">
        <MediaLibrary />
        <Preview />
        <Inspector />
      </div>
      <Timeline />
    </div>
  )
}

export default App
