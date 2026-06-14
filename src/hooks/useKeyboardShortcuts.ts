import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { removeClip, splitClipAtFrame } from '../store/slices/projectSlice'
import { selectClip, setIsPlaying } from '../store/slices/editorSlice'
import type { AppDispatch, RootState } from '../store/store'

const selectSelectedClipId = (state: RootState) => state.editor.selectedClipId
const selectSelectedClip = (state: RootState) =>
  state.editor.selectedClipId
    ? state.project.clips[state.editor.selectedClipId]
    : undefined
const selectPlayheadFrame = (state: RootState) => state.editor.playheadFrame

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
  const dispatch = useDispatch<AppDispatch>()
  const selectedClipId = useSelector(selectSelectedClipId)
  const selectedClip = useSelector(selectSelectedClip)
  const playheadFrame = useSelector(selectPlayheadFrame)
  const isPlaying = useSelector((state: RootState) => state.editor.isPlaying)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return

      if (event.code === 'Space') {
        event.preventDefault()
        dispatch(setIsPlaying(!isPlaying))
        return
      }

      if (event.key === 's' || event.key === 'S') {
        if (
          selectedClip &&
          playheadFrame > selectedClip.startFrame &&
          playheadFrame < selectedClip.startFrame + selectedClip.durationInFrames
        ) {
          event.preventDefault()
          dispatch(
            splitClipAtFrame({ clipId: selectedClip.id, frame: playheadFrame }),
          )
        }
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
  }, [dispatch, isPlaying, selectedClipId, selectedClip, playheadFrame])
}
