import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TONES, type Tone } from '@/lib/item-meta'

const SIZES = {
  sm: 'size-8 rounded-md [&_svg]:size-4',
  md: 'size-10 rounded-lg [&_svg]:size-[1.125rem]',
  lg: 'size-14 rounded-xl [&_svg]:size-6',
} as const

/** A tinted square carrying an item's category icon. */
export function ItemTile({
  icon: Icon,
  tone = 'slate',
  size = 'md',
  className,
}: {
  icon: LucideIcon
  tone?: Tone
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', SIZES[size], TONES[tone], className)}>
      <Icon aria-hidden="true" />
    </span>
  )
}
