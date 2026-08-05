import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  as?: 'article' | 'section' | 'div'
}

export function Card({ as = 'article', className = '', children, ...props }: CardProps) {
  const Element = as

  return (
    <Element className={`card ${className}`.trim()} {...props}>
      {children}
    </Element>
  )
}
