import type { MediaAsset, MediaType } from './types'
import { createId } from './id'

export function detectMediaType(file: File): MediaType | null {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('image/')) return 'image'
  return null
}

function loadImageMeta(
  objectUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => resolve({ width: 1920, height: 1080 })
    image.src = objectUrl
  })
}

function loadVideoMeta(
  objectUrl: string,
): Promise<{ width: number; height: number; duration: number; thumbnail: string }> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = objectUrl

    const finalize = (thumbnail: string) =>
      resolve({
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        thumbnail,
      })

    video.onloadeddata = () => {
      video.currentTime = Math.min(0.1, video.duration / 2 || 0)
    }
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = Math.round((160 * video.videoHeight) / video.videoWidth) || 90
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          finalize(canvas.toDataURL('image/jpeg', 0.6))
          return
        }
      } catch {
        /* tainted canvas or other failure - fall through */
      }
      finalize('')
    }
    video.onerror = () => resolve({ width: 1920, height: 1080, duration: 0, thumbnail: '' })
  })
}

function loadAudioMeta(objectUrl: string): Promise<{ duration: number }> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.src = objectUrl
    audio.onloadedmetadata = () =>
      resolve({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 })
    audio.onerror = () => resolve({ duration: 0 })
  })
}

export async function createMediaAsset(file: File): Promise<MediaAsset | null> {
  const type = detectMediaType(file)
  if (!type) return null

  const objectUrl = URL.createObjectURL(file)
  const baseAsset: MediaAsset = {
    id: createId('media'),
    type,
    name: file.name,
    objectUrl,
    naturalDurationSeconds: 0,
    width: 1920,
    height: 1080,
  }

  if (type === 'image') {
    const meta = await loadImageMeta(objectUrl)
    return {
      ...baseAsset,
      width: meta.width,
      height: meta.height,
      thumbnailUrl: objectUrl,
      naturalDurationSeconds: 0,
    }
  }

  if (type === 'video') {
    const meta = await loadVideoMeta(objectUrl)
    return {
      ...baseAsset,
      width: meta.width,
      height: meta.height,
      naturalDurationSeconds: meta.duration,
      thumbnailUrl: meta.thumbnail || undefined,
    }
  }

  const meta = await loadAudioMeta(objectUrl)
  return {
    ...baseAsset,
    naturalDurationSeconds: meta.duration,
  }
}
