import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../../store/store'
import {
  addKeyframe,
  removeClip,
  removeKeyframe,
  updateClip,
  updateClipTransform,
  updateKeyframe,
} from '../../store/slices/projectSlice'
import { selectClip } from '../../store/slices/editorSlice'
import type { Clip } from '../../utils/types'
import { SPEED_PRESETS } from '../../utils/constants'
import { createId } from '../../utils/id'

const selectFps = (state: RootState) => state.project.fps
const selectPlayheadFrame = (state: RootState) => state.editor.playheadFrame
const selectSelectedClip = (state: RootState) =>
  state.editor.selectedClipId
    ? state.project.clips[state.editor.selectedClipId]
    : undefined
const selectMediaById = (mediaId: string) => (state: RootState) =>
  state.media.assets.find((asset) => asset.id === mediaId)
import { PlusIcon, TrashIcon } from '../icons'
import {
  ColorInput,
  FieldRow,
  NumberInput,
  SectionTitle,
  SegmentedControl,
  Slider,
  Toggle,
} from '../UI'
import { KeyframeRow } from './KeyframeRow'

function durationFromTrim(clip: Clip, speed: number): number {
  const trimmed = clip.trimEndFrame - clip.trimStartFrame
  return Math.max(1, Math.round(trimmed / speed))
}

export function Inspector() {
  const dispatch = useDispatch<AppDispatch>()
  const clip = useSelector(selectSelectedClip)
  const playheadFrame = useSelector(selectPlayheadFrame)
  const fps = useSelector(selectFps)
  const media = useSelector(selectMediaById(clip?.mediaId ?? ''))
  const [isCustomSpeed, setIsCustomSpeed] = useState(false)

  if (!clip) {
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-panel">
        <div className="flex h-9 items-center border-b border-border px-3">
          <span className="text-sm font-semibold uppercase tracking-wider text-muted">
            Properties
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted-2">
          Select a clip on the timeline to edit it.
        </div>
      </aside>
    )
  }

  const isVisual = clip.type === 'image' || clip.type === 'video'
  const hasAudioTrack = clip.type === 'video' || clip.type === 'audio'
  const supportsKeyframes = isVisual

  const setTransform = (changes: Partial<Clip['transform']>) =>
    dispatch(updateClipTransform({ clipId: clip.id, changes }))
  const setClip = (changes: Partial<Clip>) =>
    dispatch(updateClip({ clipId: clip.id, changes }))

  const handleSpeedChange = (speed: number) => {
    const safeSpeed = Math.max(0.25, Math.min(4, speed))
    setClip({ speed: safeSpeed, durationInFrames: durationFromTrim(clip, safeSpeed) })
  }

  const sourceFrames = media
    ? Math.max(1, Math.floor(media.naturalDurationSeconds * fps))
    : Number.MAX_SAFE_INTEGER

  const handleTrimInChange = (value: number) => {
    const trimStartFrame = Math.max(0, Math.min(value, clip.trimEndFrame - 1))
    const durationInFrames = durationFromTrim(
      { ...clip, trimStartFrame },
      clip.speed,
    )
    // Keep the clip anchored at its timeline position; just shorten it.
    setClip({ trimStartFrame, durationInFrames })
  }

  const handleTrimOutChange = (value: number) => {
    const trimEndFrame = Math.max(
      clip.trimStartFrame + 1,
      Math.min(value, sourceFrames),
    )
    const durationInFrames = durationFromTrim(
      { ...clip, trimEndFrame },
      clip.speed,
    )
    setClip({ trimEndFrame, durationInFrames })
  }

  const showCustomSpeed = isCustomSpeed || !SPEED_PRESETS.includes(clip.speed)
  const speedSegment: number | 'custom' = showCustomSpeed ? 'custom' : clip.speed

  const handleSpeedSegment = (value: number | 'custom') => {
    if (value === 'custom') {
      setIsCustomSpeed(true)
      return
    }
    setIsCustomSpeed(false)
    handleSpeedChange(value)
  }

  const handleAddKeyframe = () => {
    const localFrame = Math.max(
      0,
      Math.min(clip.durationInFrames, playheadFrame - clip.startFrame),
    )
    dispatch(
      addKeyframe({
        clipId: clip.id,
        keyframe: {
          id: createId('kf'),
          frame: localFrame,
          easing: 'easeInOut',
          props: {
            scale: clip.transform.scale,
            translateX: clip.transform.translateX,
            translateY: clip.transform.translateY,
            opacity: 1,
          },
        },
      }),
    )
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-panel">
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="truncate text-sm font-semibold uppercase tracking-wider text-muted">
          {clip.type}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Delete"
            onClick={() => {
              dispatch(removeClip(clip.id))
              dispatch(selectClip(null))
            }}
            className="flex h-7 w-7 items-center justify-center rounded border border-border bg-panel-2 text-muted transition-colors hover:text-danger"
          >
            <TrashIcon width={13} height={13} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {/* Timing */}
        <SectionTitle>Timing</SectionTitle>
        <FieldRow label="Start (frame)">
          <NumberInput
            value={clip.startFrame}
            min={0}
            onChange={(value) => setClip({ startFrame: Math.max(0, value) })}
          />
        </FieldRow>
        <FieldRow label="Duration (frame)">
          <NumberInput
            value={clip.durationInFrames}
            min={1}
            onChange={(value) => setClip({ durationInFrames: Math.max(1, value) })}
          />
        </FieldRow>
        {clip.type !== 'image' && (
          <>
            <FieldRow label="Trim in">
              <NumberInput
                value={clip.trimStartFrame}
                min={0}
                onChange={handleTrimInChange}
              />
            </FieldRow>
            <FieldRow label="Trim out">
              <NumberInput
                value={clip.trimEndFrame}
                min={1}
                onChange={handleTrimOutChange}
              />
            </FieldRow>
            <div className="pb-1">
              <div className="flex min-h-9 items-center">
                <span className="text-sm text-muted">Speed</span>
              </div>
              <div>
                <SegmentedControl<number | 'custom'>
                  value={speedSegment}
                  options={[
                    { label: '0.5x', value: 0.5 },
                    { label: '1x', value: 1 },
                    { label: '1.5x', value: 1.5 },
                    { label: '2x', value: 2 },
                    { label: 'Custom', value: 'custom' },
                  ]}
                  onChange={handleSpeedSegment}
                />
              </div>
              {showCustomSpeed && (
                <div className="mt-2 flex justify-end">
                  <NumberInput
                    value={clip.speed}
                    step={0.25}
                    min={0.25}
                    max={4}
                    suffix="x"
                    onChange={handleSpeedChange}
                  />
                </div>
              )}
            </div>
          </>
        )}
        {clip.type === 'video' && (
          <FieldRow label="Reverse">
            <Toggle
              checked={clip.reverse}
              onChange={(checked) => setClip({ reverse: checked })}
            />
          </FieldRow>
        )}

        {/* Audio */}
        {hasAudioTrack && (
          <>
            <SectionTitle divider>Audio</SectionTitle>
            <FieldRow label="Mute">
              <Toggle
                checked={clip.muted}
                onChange={(checked) => setClip({ muted: checked })}
              />
            </FieldRow>
            <FieldRow label="Volume">
              <Slider
                value={clip.volume}
                min={0}
                max={1}
                onChange={(value) => setClip({ volume: value })}
              />
            </FieldRow>
            <FieldRow label="Fade in (frame)">
              <NumberInput
                value={clip.fadeInFrames}
                min={0}
                onChange={(value) => setClip({ fadeInFrames: Math.max(0, value) })}
              />
            </FieldRow>
            <FieldRow label="Fade out (frame)">
              <NumberInput
                value={clip.fadeOutFrames}
                min={0}
                onChange={(value) => setClip({ fadeOutFrames: Math.max(0, value) })}
              />
            </FieldRow>
          </>
        )}

        {/* Transform */}
        {isVisual && (
          <>
            <SectionTitle divider>Transform</SectionTitle>
            <FieldRow label="Scale">
              <NumberInput
                value={clip.transform.scale}
                step={0.05}
                min={0.1}
                onChange={(value) => setTransform({ scale: value })}
              />
            </FieldRow>
            <FieldRow label="Pan X">
              <NumberInput
                value={clip.transform.translateX}
                step={5}
                onChange={(value) => setTransform({ translateX: value })}
              />
            </FieldRow>
            <FieldRow label="Pan Y">
              <NumberInput
                value={clip.transform.translateY}
                step={5}
                onChange={(value) => setTransform({ translateY: value })}
              />
            </FieldRow>
            <FieldRow label="Padding (px)">
              <NumberInput
                value={clip.transform.padding}
                min={0}
                step={2}
                onChange={(value) =>
                  setTransform({ padding: Math.max(0, value) })
                }
              />
            </FieldRow>
            <FieldRow label="Padding color">
              <ColorInput
                value={clip.transform.paddingColor}
                onChange={(value) => setTransform({ paddingColor: value })}
              />
            </FieldRow>

            <SectionTitle divider>Crop (0–1)</SectionTitle>
            <FieldRow label="Crop X">
              <NumberInput
                value={clip.transform.crop.x}
                step={0.05}
                min={0}
                max={1}
                onChange={(value) =>
                  setTransform({ crop: { ...clip.transform.crop, x: value } })
                }
              />
            </FieldRow>
            <FieldRow label="Crop Y">
              <NumberInput
                value={clip.transform.crop.y}
                step={0.05}
                min={0}
                max={1}
                onChange={(value) =>
                  setTransform({ crop: { ...clip.transform.crop, y: value } })
                }
              />
            </FieldRow>
            <FieldRow label="Crop W">
              <NumberInput
                value={clip.transform.crop.width}
                step={0.05}
                min={0.05}
                max={1}
                onChange={(value) =>
                  setTransform({ crop: { ...clip.transform.crop, width: value } })
                }
              />
            </FieldRow>
            <FieldRow label="Crop H">
              <NumberInput
                value={clip.transform.crop.height}
                step={0.05}
                min={0.05}
                max={1}
                onChange={(value) =>
                  setTransform({
                    crop: { ...clip.transform.crop, height: value },
                  })
                }
              />
            </FieldRow>
          </>
        )}

        {/* Keyframes */}
        {supportsKeyframes && (
          <>
            <div className="mt-3 mb-1 flex items-center justify-between">
              <span className="text-xxs font-semibold uppercase tracking-wider text-muted-2">
                Keyframes (zoom / pan)
              </span>
              <button
                type="button"
                onClick={handleAddKeyframe}
                className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-xxs font-medium text-primary-fg transition-colors hover:bg-primary-hover"
              >
                <PlusIcon width={10} height={10} />
                At playhead
              </button>
            </div>
            {clip.keyframes.length === 0 ? (
              <p className="text-xxs text-muted-2">
                Add keyframes to animate zoom and pan over time.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {clip.keyframes.map((keyframe) => (
                  <KeyframeRow
                    key={keyframe.id}
                    keyframe={keyframe}
                    maxFrame={clip.durationInFrames}
                    onChange={(changes) =>
                      dispatch(
                        updateKeyframe({
                          clipId: clip.id,
                          keyframeId: keyframe.id,
                          changes,
                        }),
                      )
                    }
                    onRemove={() =>
                      dispatch(
                        removeKeyframe({
                          clipId: clip.id,
                          keyframeId: keyframe.id,
                        }),
                      )
                    }
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
