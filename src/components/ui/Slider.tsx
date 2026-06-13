export function Slider({
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
