import { cn } from '@/lib/utils'

/**
 * The Pusaka mark: a single kawung flower — four petals closed around a
 * point, the way an heirloom is kept. Petals are brass, the seed is the
 * surface colour, the tile is indigo.
 */
export function LogoMark({
  className,
  animated = false,
  tile = true,
}: {
  className?: string
  /** Open the petals once on mount (landing hero / auth panel only). */
  animated?: boolean
  /** Draw the indigo tile behind the petals. */
  tile?: boolean
}) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      {tile && <rect width="32" height="32" rx="8" className="fill-primary dark:fill-[#2B3478]" />}
      <g className={cn('fill-brass dark:fill-[#D9AE55]', animated && 'petal-open')}>
        <ellipse cx="10.2" cy="10.2" rx="5.2" ry="4.2" transform="rotate(45 10.2 10.2)" />
        <ellipse cx="21.8" cy="10.2" rx="5.2" ry="4.2" transform="rotate(-45 21.8 10.2)" />
        <ellipse cx="10.2" cy="21.8" rx="5.2" ry="4.2" transform="rotate(-45 10.2 21.8)" />
        <ellipse cx="21.8" cy="21.8" rx="5.2" ry="4.2" transform="rotate(45 21.8 21.8)" />
        <circle cx="16" cy="16" r="1.8" className={tile ? 'fill-[#F7F8FD]' : 'fill-current'} />
      </g>
    </svg>
  )
}

export function Logo({
  className,
  markClassName,
  animated,
}: {
  className?: string
  markClassName?: string
  animated?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} translate="no">
      <LogoMark className={markClassName} animated={animated} />
      <span className="text-lg font-extrabold tracking-[-0.02em]">Pusaka</span>
    </span>
  )
}
