/**
 * Reverse playback can't decode a video backward smoothly (decoders only run
 * forward from keyframes), so we decode the frames a reversed clip needs once
 * and keep them as ImageBitmaps in memory. The preview then just draws the
 * right cached frame each tick - zero per-frame decode, no buffering.
 */

import type { CacheEntry, ReverseFramesParams } from '../utils/types'
import { MAX_CACHE_ENTRIES, MAX_DIMENSION } from '../utils/constants'

const cache = new Map<string, Promise<CacheEntry>>()

function signature(params: ReverseFramesParams): string {
  return [
    params.mediaId,
    params.trimStartFrame,
    params.trimEndFrame,
    params.speed,
    params.durationInFrames,
    params.fps,
  ].join(':')
}

/**
 * Maps each clip-local frame to the source frame it should show when reversed.
 * Mirrors the per-frame reverse math used on the export path.
 */
export function buildReverseFrameMap(params: {
  trimStartFrame: number
  trimEndFrame: number
  speed: number
  durationInFrames: number
  sourceFrames: number
}): number[] {
  const { trimStartFrame, trimEndFrame, speed, durationInFrames, sourceFrames } =
    params
  const map: number[] = []
  for (let localFrame = 0; localFrame < durationInFrames; localFrame += 1) {
    const sourceFrame = Math.round(trimEndFrame - 1 - localFrame * speed)
    const clamped = Math.max(
      trimStartFrame,
      Math.min(sourceFrames - 1, sourceFrame),
    )
    map.push(clamped)
  }
  return map
}

function waitForEvent(target: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Failed to load media for reverse caching'))
    }
    const cleanup = () => {
      target.removeEventListener(event, onSuccess)
      target.removeEventListener('error', onError)
    }
    target.addEventListener(event, onSuccess)
    target.addEventListener('error', onError)
  })
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
  })
}

async function buildFrames(
  params: ReverseFramesParams,
  onProgress?: (ratio: number) => void,
): Promise<CacheEntry> {
  const frameMap = buildReverseFrameMap(params)

  const video = document.createElement('video')
  video.muted = true
  video.preload = 'auto'
  video.crossOrigin = 'anonymous'
  video.src = params.mediaUrl
  await waitForEvent(video, 'loadeddata')

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(params.sourceWidth, params.sourceHeight),
  )
  const canvasWidth = Math.max(1, Math.round(params.sourceWidth * scale))
  const canvasHeight = Math.max(1, Math.round(params.sourceHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable for reverse caching')
  }

  const uniqueSourceFrames = Array.from(new Set(frameMap))
  const bitmapBySourceFrame = new Map<number, ImageBitmap>()

  for (let index = 0; index < uniqueSourceFrames.length; index += 1) {
    const sourceFrame = uniqueSourceFrames[index]
    await seekTo(video, sourceFrame / params.fps + 1e-3)
    ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight)
    const bitmap = await createImageBitmap(canvas)
    bitmapBySourceFrame.set(sourceFrame, bitmap)
    onProgress?.((index + 1) / uniqueSourceFrames.length)
  }

  video.removeAttribute('src')
  video.load()

  const framesByLocalFrame = frameMap.map(
    (sourceFrame) => bitmapBySourceFrame.get(sourceFrame) as ImageBitmap,
  )
  const uniqueBitmaps = Array.from(bitmapBySourceFrame.values())

  return { framesByLocalFrame, uniqueBitmaps }
}

function touch(key: string, entryPromise: Promise<CacheEntry>): void {
  cache.delete(key)
  cache.set(key, entryPromise)
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey === undefined) break
    const oldest = cache.get(oldestKey)
    cache.delete(oldestKey)
    oldest
      ?.then((entry) => entry.uniqueBitmaps.forEach((bitmap) => bitmap.close()))
      .catch(() => {})
  }
}

export function getReversedFrames(
  params: ReverseFramesParams,
  onProgress?: (ratio: number) => void,
): Promise<ImageBitmap[]> {
  const key = signature(params)
  let entryPromise = cache.get(key)
  if (!entryPromise) {
    entryPromise = buildFrames(params, onProgress)
  }
  touch(key, entryPromise)
  return entryPromise.then((entry) => entry.framesByLocalFrame)
}
