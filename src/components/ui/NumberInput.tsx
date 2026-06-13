import { useState } from 'react'

export function NumberInput({
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

  const clamp = (parsed: number) => {
    let next = parsed
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    return next
  }

  const nudge = (direction: 1 | -1) => {
    const next = clamp(Math.round((canonical + direction * step) * 1000) / 1000)
    setDraft(null)
    onChange(next)
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? String(canonical)}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const raw = event.target.value
          setDraft(raw)
          if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return
          const parsed = Number(raw)
          if (Number.isFinite(parsed)) {
            onChange(clamp(parsed))
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            nudge(1)
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            nudge(-1)
          }
        }}
        onBlur={() => setDraft(null)}
        className="w-20 rounded border border-border bg-panel px-2 py-1 text-right text-xs text-fg outline-none focus:border-primary"
      />
      {suffix && <span className="text-xxs text-muted-2">{suffix}</span>}
    </div>
  )
}
