import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from './index'

export const selectProject = (state: RootState) => state.project
export const selectTracks = (state: RootState) => state.project.tracks
export const selectClips = (state: RootState) => state.project.clips
export const selectFps = (state: RootState) => state.project.fps
export const selectCompositionWidth = (state: RootState) => state.project.width
export const selectCompositionHeight = (state: RootState) => state.project.height

export const selectClipById = (clipId: string) => (state: RootState) =>
  state.project.clips[clipId]

export const selectMediaAssets = (state: RootState) => state.media.assets
export const selectMediaById = (mediaId: string) => (state: RootState) =>
  state.media.assets.find((asset) => asset.id === mediaId)

export const selectSelectedClipId = (state: RootState) =>
  state.editor.selectedClipId
export const selectSelectedClip = (state: RootState) =>
  state.editor.selectedClipId
    ? state.project.clips[state.editor.selectedClipId]
    : undefined
export const selectPlayheadFrame = (state: RootState) =>
  state.editor.playheadFrame
export const selectIsPlaying = (state: RootState) => state.editor.isPlaying
export const selectPixelsPerFrame = (state: RootState) =>
  state.editor.pixelsPerFrame

const MIN_TIMELINE_FRAMES = 30

export const selectProjectDurationInFrames = createSelector(
  [selectClips, selectFps],
  (clips, fps) => {
    const end = Object.values(clips).reduce((max, clip) => {
      return Math.max(max, clip.startFrame + clip.durationInFrames)
    }, 0)
    return Math.max(MIN_TIMELINE_FRAMES, end || fps * 10)
  },
)
