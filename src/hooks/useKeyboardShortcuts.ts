import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../store/hooks'
import { selectSelectedClipId } from '../store/selectors'
import { removeClip } from '../store/slices/projectSlice'
import { selectClip, setIsPlaying } from '../store/slices/editorSlice'
import type { RootState } from '../store'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function useKeyboardShortcuts() {
  const dispatch = useAppDispatch()
  const selectedClipId = useSelector(selectSelectedClipId)
  const isPlaying = useSelector((state: RootState) => state.editor.isPlaying)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return

      if (event.code === 'Space') {
        event.preventDefault()
        dispatch(setIsPlaying(!isPlaying))
        return
      }

      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedClipId
      ) {
        event.preventDefault()
        dispatch(removeClip(selectedClipId))
        dispatch(selectClip(null))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, isPlaying, selectedClipId])
}
