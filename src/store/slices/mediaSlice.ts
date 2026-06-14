import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MediaAsset, MediaState } from '../../utils/types'

const initialState: MediaState = {
  assets: [],
}

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    addMediaAsset(state, action: PayloadAction<MediaAsset>) {
      state.assets.push(action.payload)
    },
    removeMediaAsset(state, action: PayloadAction<string>) {
      state.assets = state.assets.filter((asset) => asset.id !== action.payload)
    },
  },
})

export const { addMediaAsset, removeMediaAsset } = mediaSlice.actions
export default mediaSlice.reducer
