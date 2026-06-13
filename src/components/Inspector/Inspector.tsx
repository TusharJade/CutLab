import { useSelector } from 'react-redux'
import { useAppDispatch } from '../../store/hooks'
import { selectPlayheadFrame, selectSelectedClip } from '../../store/selectors'
import {
  addKeyframe,
  duplicateClip,
  removeClip,
  removeKeyframe,
  updateClip,
  updateClipTransform,
  updateKeyframe,
} from '../../store/slices/projectSlice'
import { selectClip } from '../../store/slices/editorSlice'
import type { Clip, EasingType } from '../../types'
import { createId } from '../../utils/id'
import { CopyIcon, PlusIcon, TrashIcon } from '../icons'
import {
  ColorInput,
  FieldRow,
  NumberInput,
  SectionTitle,
  Slider,
  Toggle,
} from '../ui'

const EASINGS: EasingType[] = ['linear', 'easeIn', 'easeOut', 'easeInOut']

function durationFromTrim(clip: Clip, speed: number): number {
  const trimmed = clip.trimEndFrame - clip.trimStartFrame
  return Math.max(1, Math.round(trimmed / speed))
}

export function Inspector() {
  const dispatch = useAppDispatch()
  const clip = useSelector(selectSelectedClip)
  const playheadFrame = useSelector(selectPlayheadFrame)

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
            title="Duplicate"
            onClick={() => dispatch(duplicateClip(clip.id))}
            className="flex h-7 w-7 items-center justify-center rounded border border-border bg-panel-2 text-muted transition-colors hover:text-fg"
          >
            <CopyIcon width={13} height={13} />
          </button>
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
                onChange={(value) =>
                  setClip({
                    trimStartFrame: Math.max(
                      0,
                      Math.min(value, clip.trimEndFrame - 1),
                    ),
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Trim out">
              <NumberInput
                value={clip.trimEndFrame}
                min={1}
                onChange={(value) =>
                  setClip({
                    trimEndFrame: Math.max(clip.trimStartFrame + 1, value),
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Speed">
              <NumberInput
                value={clip.speed}
                step={0.25}
                min={0.25}
                max={4}
                suffix="x"
                onChange={handleSpeedChange}
              />
            </FieldRow>
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
            <SectionTitle>Audio</SectionTitle>
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
            <SectionTitle>Transform</SectionTitle>
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

            <SectionTitle>Crop (0–1)</SectionTitle>
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
                  <li
                    key={keyframe.id}
                    className="rounded-lg border border-border bg-panel-2 p-2"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xxs font-medium text-fg">
                        Frame {keyframe.frame}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            removeKeyframe({
                              clipId: clip.id,
                              keyframeId: keyframe.id,
                            }),
                          )
                        }
                        className="text-muted-2 transition-colors hover:text-danger"
                      >
                        <TrashIcon width={11} height={11} />
                      </button>
                    </div>
                    <FieldRow label="Frame">
                      <NumberInput
                        value={keyframe.frame}
                        min={0}
                        max={clip.durationInFrames}
                        onChange={(value) =>
                          dispatch(
                            updateKeyframe({
                              clipId: clip.id,
                              keyframeId: keyframe.id,
                              changes: { frame: Math.max(0, value) },
                            }),
                          )
                        }
                      />
                    </FieldRow>
                    <FieldRow label="Scale">
                      <NumberInput
                        value={keyframe.props.scale}
                        step={0.05}
                        min={0.1}
                        onChange={(value) =>
                          dispatch(
                            updateKeyframe({
                              clipId: clip.id,
                              keyframeId: keyframe.id,
                              changes: { props: { ...keyframe.props, scale: value } },
                            }),
                          )
                        }
                      />
                    </FieldRow>
                    <FieldRow label="Pan X">
                      <NumberInput
                        value={keyframe.props.translateX}
                        step={5}
                        onChange={(value) =>
                          dispatch(
                            updateKeyframe({
                              clipId: clip.id,
                              keyframeId: keyframe.id,
                              changes: {
                                props: { ...keyframe.props, translateX: value },
                              },
                            }),
                          )
                        }
                      />
                    </FieldRow>
                    <FieldRow label="Pan Y">
                      <NumberInput
                        value={keyframe.props.translateY}
                        step={5}
                        onChange={(value) =>
                          dispatch(
                            updateKeyframe({
                              clipId: clip.id,
                              keyframeId: keyframe.id,
                              changes: {
                                props: { ...keyframe.props, translateY: value },
                              },
                            }),
                          )
                        }
                      />
                    </FieldRow>
                    <FieldRow label="Opacity">
                      <Slider
                        value={keyframe.props.opacity}
                        min={0}
                        max={1}
                        onChange={(value) =>
                          dispatch(
                            updateKeyframe({
                              clipId: clip.id,
                              keyframeId: keyframe.id,
                              changes: {
                                props: { ...keyframe.props, opacity: value },
                              },
                            }),
                          )
                        }
                      />
                    </FieldRow>
                    <FieldRow label="Easing">
                      <select
                        value={keyframe.easing}
                        onChange={(event) =>
                          dispatch(
                            updateKeyframe({
                              clipId: clip.id,
                              keyframeId: keyframe.id,
                              changes: { easing: event.target.value as EasingType },
                            }),
                          )
                        }
                        className="rounded border border-border bg-panel px-2 py-1 text-xs text-fg outline-none focus:border-primary"
                      >
                        {EASINGS.map((easing) => (
                          <option key={easing} value={easing}>
                            {easing}
                          </option>
                        ))}
                      </select>
                    </FieldRow>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
