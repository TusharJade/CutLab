import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ThemeMode } from '../../types'

const STORAGE_KEY = 'cutlab-theme'

function readInitialMode(): ThemeMode {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  }
  return 'dark'
}

interface ThemeState {
  mode: ThemeMode
}

const initialState: ThemeState = {
  mode: readInitialMode(),
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, action.payload)
      }
    },
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark'
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, state.mode)
      }
    },
  },
})

export const { setThemeMode, toggleTheme } = themeSlice.actions
export default themeSlice.reducer
