'use client'

import Link from 'next/link'
import { FolderLock, KeyRound, Users } from 'lucide-react'
import { LogoMark } from '@/components/brand/logo'
import { useT } from '@/lib/i18n'

const OTHER_TAGLINE = {
  en: { text: 'Simpan dengan Tenang. Jaga dengan Bangga.', lang: 'id' },
  id: { text: 'Store with peace. Guard with pride.', lang: 'en' },
} as const

const FACTS = [
  { icon: KeyRound, text: 'Encrypted with a key derived from your password (PBKDF2, 600,000 iterations)' },
  { icon: FolderLock, text: 'Passwords, notes and documents in one vault' },
  { icon: Users, text: 'Share with family or team, with roles' },
]

const sentences = (text: string) => text.split(/(?<=\.)\s+/)

/** The indigo brand panel on the left of every auth screen (lg and up). */
export function AuthBrandPanel() {
  const { t, lang } = useT()
  const other = OTHER_TAGLINE[lang]

  return (
    // .kawung sets position: relative, so the sticky wrapper and the motif live on separate elements.
    <aside className="sticky top-0 hidden h-dvh overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
      <div className="kawung kawung-fade-r flex h-full flex-col justify-between p-12 [--kawung-color:rgba(217,174,85,0.14)] [--kawung-size:64px] xl:p-16">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-3 rounded-lg focus-visible:outline-sidebar-ring"
          translate="no"
        >
          <LogoMark animated className="size-16" />
          <span className="text-2xl font-extrabold tracking-[-0.02em] text-sidebar-accent-foreground">Pusaka</span>
        </Link>

        <div className="max-w-md space-y-5">
          <p className="text-4xl leading-[1.1] font-extrabold tracking-[-0.03em] text-balance text-sidebar-accent-foreground xl:text-[2.75rem]">
            {sentences(t.brand.tagline).map((line) => (
              <span key={line} className="block">
                {line.replace(/\.$/, '')}
                {/* Plus Jakarta's full stop sits loose at display sizes; pull it in. */}
                {line.endsWith('.') && <span className="-ml-[0.1em]">.</span>}
              </span>
            ))}
          </p>
          <p lang={other.lang} className="text-lg text-balance text-sidebar-foreground/70">
            {other.text}
          </p>
        </div>

        <ul className="max-w-md space-y-4 border-t border-sidebar-border pt-8 text-sm text-sidebar-foreground/80">
          {FACTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="pt-1.5 leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
