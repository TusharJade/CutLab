import type { ReactNode } from 'react'

export function SectionTitle({
  children,
  divider = false,
}: {
  children: ReactNode
  divider?: boolean
}) {
  return (
    <h3
      className={`mb-1 text-xs font-semibold uppercase tracking-wider text-muted-2 ${
        divider ? 'mt-4 border-t border-border pt-4' : 'mt-3'
      }`}
    >
      {children}
    </h3>
  )
}
