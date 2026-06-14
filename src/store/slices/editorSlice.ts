import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { EditorState } from '../../utils/types'
import { MAX_ZOOM, MIN_ZOOM } from '../../utils/constants'

const initialState: EditorState = {
  selectedClipId: null,
  playheadFrame: 0,
  isPlaying: false,
  pixelsPerFrame: 4,
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    selectClip(state, action: PayloadAction<string | null>) {
      state.selectedClipId = action.payload
    },
    setPlayheadFrame(state, action: PayloadAction<number>) {
      state.playheadFrame = Math.max(0, Math.round(action.payload))
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload
    },
    setPixelsPerFrame(state, action: PayloadAction<number>) {
      state.pixelsPerFrame = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, action.payload))
    },
    zoomIn(state) {
      state.pixelsPerFrame = Math.min(MAX_ZOOM, state.pixelsPerFrame * 1.25)
    },
    zoomOut(state) {
      state.pixelsPerFrame = Math.max(MIN_ZOOM, state.pixelsPerFrame / 1.25)
    },
  },
})

export const {
  selectClip,
  setPlayheadFrame,
  setIsPlaying,
  setPixelsPerFrame,
  zoomIn,
  zoomOut,
} = editorSlice.actions
export default editorSlice.reducer
