import type { ReactNode } from 'react'

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
