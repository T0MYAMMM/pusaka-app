'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Check, Languages, Monitor, Moon, Plus, Search, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoMark } from '@/components/brand/logo'
import { Kbd } from '@/components/shared/kbd'
import { useT, type Lang } from '@/lib/i18n'
import { MobileNav } from './mobile-nav'
import { useCommandPalette } from './command-palette'
import { getNav } from './nav-config'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' },
]

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const { t, lang, setLang } = useT()
  const palette = useCommandPalette()
  const nav = getNav(t)

  const themes = [
    { value: 'light', label: t.shell.light, icon: Sun },
    { value: 'dark', label: t.shell.dark, icon: Moon },
    { value: 'system', label: t.shell.system, icon: Monitor },
  ]

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6 lg:px-8">
      <MobileNav />
      <Link href="/dashboard" className="mr-1 rounded-lg lg:hidden" aria-label="Pusaka home">
        <LogoMark className="size-8" />
      </Link>

      {/* Search trigger — opens ⌘K */}
      <button
        type="button"
        onClick={palette.open}
        className="group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-left text-sm text-muted-foreground shadow-xs transition-colors hover:border-input hover:text-foreground sm:max-w-md"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{t.shell.searchTrigger}</span>
        <span className="ml-auto hidden items-center gap-1 sm:inline-flex" aria-hidden="true">
          <Kbd>⌘</Kbd><Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        {/* Quick add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 px-2.5 sm:px-3">
              <Plus aria-hidden="true" />
              <span className="hidden sm:inline">{t.common.new}</span>
              <span className="sr-only sm:hidden">{t.common.new}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {nav.create.map(({ href, label, icon: Icon }) => (
              <DropdownMenuItem key={href} asChild>
                <Link href={href}>
                  <Icon aria-hidden="true" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2 text-muted-foreground hover:text-foreground">
              <Languages aria-hidden="true" />
              <span className="text-xs font-bold uppercase" aria-hidden="true">{lang}</span>
              <span className="sr-only">{t.shell.language}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t.shell.language}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LANGS.map(({ code, label }) => (
              <DropdownMenuItem key={code} onClick={() => setLang(code)}>
                <span className="flex-1">{label}</span>
                {lang === code && <Check className="text-primary" aria-hidden="true" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative size-9 text-muted-foreground hover:text-foreground">
              <Sun className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" aria-hidden="true" />
              <Moon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" aria-hidden="true" />
              <span className="sr-only">{t.shell.theme}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>{t.shell.theme}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {themes.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                <Icon aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {theme === value && <Check className="text-primary" aria-hidden="true" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
