import { useState, type ReactNode } from 'react'

export function FieldRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export function NumberField({
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
}: {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const canonical = Number.isFinite(value) ? Math.round(value * 1000) / 1000 : 0

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={draft ?? canonical}
        step={step}
        min={min}
        max={max}
        onChange={(event) => {
          const raw = event.target.value
          setDraft(raw)
          const parsed = Number(raw)
          if (raw !== '' && Number.isFinite(parsed)) {
            onChange(parsed)
          }
        }}
        onBlur={() => setDraft(null)}
        className="w-20 rounded border border-border bg-panel px-2 py-1 text-right text-xs text-fg outline-none focus:border-primary"
      />
      {suffix && <span className="text-xxs text-muted-2">{suffix}</span>}
    </div>
  )
}

export function SliderField({
  value,
  onChange,
  min,
  max,
  step = 0.01,
}: {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
}) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-panel-3 accent-primary"
    />
  )
}

export function ToggleField({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-panel-3'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function ColorField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-7 w-9 cursor-pointer rounded border border-border bg-panel"
    />
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-3 mb-1 text-xxs font-semibold uppercase tracking-wider text-muted-2">
      {children}
    </h3>
  )
}
