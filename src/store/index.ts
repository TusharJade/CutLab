import { configureStore } from '@reduxjs/toolkit'
import projectReducer from './slices/projectSlice'
import mediaReducer from './slices/mediaSlice'
import editorReducer from './slices/editorSlice'
import themeReducer from './slices/themeSlice'

export const store = configureStore({
  reducer: {
    project: projectReducer,
    media: mediaReducer,
    editor: editorReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
