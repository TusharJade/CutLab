import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../../store/hooks'
import { selectMediaAssets } from '../../store/selectors'
import { addMediaAsset, removeMediaAsset } from '../../store/slices/mediaSlice'
import { addMediaToTimeline } from '../../store/thunks'
import type { MediaAsset } from '../../types'
import { createMediaAsset } from '../../utils/media'
import { formatSeconds } from '../../utils/format'
import {
  AudioIcon,
  ImageIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  VideoIcon,
} from '../icons'

const TYPE_ICON = {
  video: VideoIcon,
  audio: AudioIcon,
  image: ImageIcon,
}

function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  if (asset.thumbnailUrl) {
    return (
      <img
        src={asset.thumbnailUrl}
        alt={asset.name}
        className="h-12 w-16 shrink-0 rounded object-cover"
      />
    )
  }
  const Icon = TYPE_ICON[asset.type]
  return (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-panel-3 text-muted">
      <Icon width={18} height={18} />
    </div>
  )
}

export function MediaLibrary() {
  const dispatch = useAppDispatch()
  const assets = useSelector(selectMediaAssets)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  async function importFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setIsImporting(true)
    for (const file of Array.from(files)) {
      const asset = await createMediaAsset(file)
      if (asset) {
        dispatch(addMediaAsset(asset))
      }
    }
    setIsImporting(false)
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted">
          Media
        </span>
        <label className="flex cursor-pointer items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-fg transition-colors hover:bg-primary-hover">
          <PlusIcon width={12} height={12} />
          Add
          <input
            type="file"
            accept="video/*,audio/*,image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void importFiles(event.target.files)
              event.target.value = ''
            }}
          />
        </label>
      </div>

      <div
        className={`m-3 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border text-muted'
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void importFiles(event.dataTransfer.files)
        }}
      >
        <UploadIcon width={20} height={20} />
        <p className="px-4 text-xs leading-tight">
          {isImporting ? 'Importing…' : 'Drop video, audio or images here'}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {assets.length === 0 ? (
          <p className="mt-4 text-center text-xs text-muted-2">
            No media yet. Add files to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="group flex items-center gap-2 rounded-lg border border-border bg-panel-2 p-2 transition-colors hover:border-border-strong"
              >
                <MediaThumbnail asset={asset} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{asset.name}</p>
                  <p className="text-xxs uppercase tracking-wider text-muted-2">
                    {asset.type}
                    {asset.type !== 'image' &&
                      ` · ${formatSeconds(asset.naturalDurationSeconds)}`}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    title="Add to timeline"
                    onClick={() => dispatch(addMediaToTimeline(asset))}
                    className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-fg transition-colors hover:bg-primary-hover"
                  >
                    <PlusIcon width={12} height={12} />
                  </button>
                  <button
                    type="button"
                    title="Remove media"
                    onClick={() => dispatch(removeMediaAsset(asset.id))}
                    className="flex h-6 w-6 items-center justify-center rounded bg-panel-3 text-muted transition-colors hover:text-danger"
                  >
                    <TrashIcon width={12} height={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
