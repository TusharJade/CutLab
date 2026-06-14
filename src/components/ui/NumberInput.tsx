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

  const atMin = min !== undefined && canonical <= min
  const atMax = max !== undefined && canonical >= max
  const stepperButton =
    'flex h-7 w-7 shrink-0 cursor-pointer select-none items-center justify-center text-base leading-none text-muted-2 transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center rounded border border-border bg-panel focus-within:border-primary">
        <button
          type="button"
          aria-label="Decrease"
          disabled={atMin}
          onClick={() => nudge(-1)}
          className={stepperButton}
        >
          −
        </button>
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
          className="w-12 border-x border-border bg-transparent py-1 text-center text-sm text-fg outline-none"
        />
        <button
          type="button"
          aria-label="Increase"
          disabled={atMax}
          onClick={() => nudge(1)}
          className={stepperButton}
        >
          +
        </button>
      </div>
      {suffix && <span className="text-xs text-muted-2">{suffix}</span>}
    </div>
  )
}
