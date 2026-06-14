import type { SegmentOption } from '../../utils/types'

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-panel p-0.5">
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-fg'
                : 'text-muted hover:bg-panel-3 hover:text-fg'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
