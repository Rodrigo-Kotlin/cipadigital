import type { HTMLAttributes, ReactNode } from 'react'

interface ResponsiveContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function ResponsiveContainer({
  className = '',
  children,
  ...props
}: ResponsiveContainerProps) {
  return (
    <div className={`container ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}
