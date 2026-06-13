import type { ReactNode } from 'react'

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-3 mb-1 text-xxs font-semibold uppercase tracking-wider text-muted-2">
      {children}
    </h3>
  )
}
