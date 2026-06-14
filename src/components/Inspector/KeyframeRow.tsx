import type { EasingType, Keyframe } from '../../types'
import { TrashIcon } from '../icons'
import { FieldRow, NumberInput, Slider } from '../ui'

const EASINGS: EasingType[] = ['linear', 'easeIn', 'easeOut', 'easeInOut']

interface KeyframeRowProps {
  keyframe: Keyframe
  maxFrame: number
  onChange: (changes: Partial<Keyframe>) => void
  onRemove: () => void
}

export function KeyframeRow({
  keyframe,
  maxFrame,
  onChange,
  onRemove,
}: KeyframeRowProps) {
  const setProps = (changes: Partial<Keyframe['props']>) =>
    onChange({ props: { ...keyframe.props, ...changes } })

  return (
    <li className="rounded-lg border border-border bg-panel-2 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xxs font-medium text-fg">
          Frame {keyframe.frame}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-2 transition-colors hover:text-danger"
        >
          <TrashIcon width={11} height={11} />
        </button>
      </div>
      <FieldRow label="Frame">
        <NumberInput
          value={keyframe.frame}
          min={0}
          max={maxFrame}
          onChange={(value) => onChange({ frame: Math.max(0, value) })}
        />
      </FieldRow>
      <FieldRow label="Scale">
        <NumberInput
          value={keyframe.props.scale}
          step={0.05}
          min={0.1}
          onChange={(value) => setProps({ scale: value })}
        />
      </FieldRow>
      <FieldRow label="Pan X">
        <NumberInput
          value={keyframe.props.translateX}
          step={5}
          onChange={(value) => setProps({ translateX: value })}
        />
      </FieldRow>
      <FieldRow label="Pan Y">
        <NumberInput
          value={keyframe.props.translateY}
          step={5}
          onChange={(value) => setProps({ translateY: value })}
        />
      </FieldRow>
      <FieldRow label="Opacity">
        <Slider
          value={keyframe.props.opacity}
          min={0}
          max={1}
          onChange={(value) => setProps({ opacity: value })}
        />
      </FieldRow>
      <FieldRow label="Easing">
        <select
          value={keyframe.easing}
          onChange={(event) =>
            onChange({ easing: event.target.value as EasingType })
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
  )
}
