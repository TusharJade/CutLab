import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../../store/store'
import { addMediaAsset, removeMediaAsset } from '../../store/slices/mediaSlice'
import {
  addMediaToTimeline,
  removeClipsByMedia,
} from '../../store/slices/projectSlice'
import { selectClip } from '../../store/slices/editorSlice'
import type { MediaAsset } from '../../utils/types'
import { createMediaAsset } from '../../utils/media'
import { formatSeconds } from '../../utils/format'
import {
  AudioIcon,
  CloudUploadIcon,
  ImageIcon,
  TrashIcon,
  VideoIcon,
} from '../icons'

const selectClips = (state: RootState) => state.project.clips
const selectMediaAssets = (state: RootState) => state.media.assets
const selectSelectedClipId = (state: RootState) => state.editor.selectedClipId

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
        className="h-full w-full object-cover"
      />
    )
  }
  const Icon = TYPE_ICON[asset.type]
  return (
    <div className="flex h-full w-full items-center justify-center bg-panel-3 text-muted">
      <Icon width={22} height={22} />
    </div>
  )
}

function MediaCard({
  asset,
  onAdd,
  onRemove,
}: {
  asset: MediaAsset
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      title="Add to timeline"
      onClick={onAdd}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onAdd()
        }
      }}
      className="group flex cursor-pointer flex-col gap-1.5 rounded-lg border border-border bg-panel-2 p-1.5 transition-colors hover:border-border-strong"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-panel-3">
        <MediaThumbnail asset={asset} />
        {asset.type !== 'image' && (
          <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1 text-xxs font-medium text-white">
            {formatSeconds(asset.naturalDurationSeconds)}
          </span>
        )}
        <button
          type="button"
          title="Remove media"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded bg-black/55 text-white opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        >
          <TrashIcon width={13} height={13} />
        </button>
      </div>
      <p className="truncate text-sm font-medium" title={asset.name}>
        {asset.name}
      </p>
    </div>
  )
}

export function MediaLibrary() {
  const dispatch = useDispatch<AppDispatch>()
  const assets = useSelector(selectMediaAssets)
  const clips = useSelector(selectClips)
  const selectedClipId = useSelector(selectSelectedClipId)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null)

  const confirmDelete = () => {
    if (!pendingDelete) return
    const selectedClip = selectedClipId ? clips[selectedClipId] : undefined
    if (selectedClip && selectedClip.mediaId === pendingDelete.id) {
      dispatch(selectClip(null))
    }
    dispatch(removeClipsByMedia(pendingDelete.id))
    dispatch(removeMediaAsset(pendingDelete.id))
    setPendingDelete(null)
  }

  const addToTimeline = (asset: MediaAsset) => {
    const action = dispatch(addMediaToTimeline(asset))
    dispatch(selectClip(action.payload.clipId))
  }

  async function importFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setIsImporting(true)
    for (const file of Array.from(files)) {
      const asset = await createMediaAsset(file)
      if (asset) {
        dispatch(addMediaAsset(asset))
        addToTimeline(asset)
      }
    }
    setIsImporting(false)
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex h-9 items-center border-b border-border px-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted">
          Media
        </span>
      </div>

      <label
        className={`m-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10 text-fg'
            : 'border-border text-muted hover:border-border-strong hover:text-fg'
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
        <CloudUploadIcon width={28} height={28} />
        <div className="px-4 leading-tight">
          <p className="text-base font-semibold text-fg">
            {isImporting ? 'Importing…' : 'Click to upload'}
          </p>
          <p className="text-sm text-muted">or drag &amp; drop file here</p>
        </div>
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

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {assets.length === 0 ? (
          <p className="mt-4 text-center text-sm text-muted-2">
            No media yet. Upload files to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                onAdd={() => addToTimeline(asset)}
                onRemove={() => setPendingDelete(asset)}
              />
            ))}
          </div>
        )}
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-104 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-panel p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
                <TrashIcon />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-fg">Delete file</h2>
                <p className="mt-1.5 text-base leading-relaxed text-muted">
                  Any associated timeline clips will also be removed. Are you
                  sure you want to delete{' '}
                  <span className="font-semibold text-fg">
                    {pendingDelete.name}
                  </span>
                  ?
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="h-9 rounded-md border border-border bg-panel-2 px-4 text-base text-fg transition-colors hover:bg-panel-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-9 rounded-md bg-danger px-4 text-base font-medium text-white transition-colors hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
