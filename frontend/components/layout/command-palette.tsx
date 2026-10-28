'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { Languages, Loader2, Monitor, Moon, Sun } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command'
import { ItemTile } from '@/components/shared/item-tile'
import { Kbd } from '@/components/shared/kbd'
import { dashboardApi } from '@/lib/api'
import { credentialMeta, noteMeta } from '@/lib/item-meta'
import { useDebounced } from '@/lib/hooks'
import { useT } from '@/lib/i18n'
import { getNav } from './nav-config'

const CommandPaletteContext = createContext<{ open: () => void }>({ open: () => {} })
export const useCommandPalette = () => useContext(CommandPaletteContext)

/**
 * ⌘K / Ctrl+K palette: search every credential and note, jump to any page,
 * create items and switch theme or language without leaving the keyboard.
 */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const open = useCallback(() => setOpen(true), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo(() => ({ open }), [open])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          {isOpen && <Palette onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </CommandPaletteContext.Provider>
  )
}

function Palette({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { t, lang, setLang } = useT()
  const [q, setQ] = useState('')
  const debounced = useDebounced(q.trim(), 180)
  const nav = getNav(t)

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => dashboardApi.search({ q: debounced }),
    enabled: debounced.length >= 2,
    staleTime: 10_000,
  })

  const go = (href: string) => { onDone(); router.push(href) }
  const match = (label: string) => label.toLowerCase().includes(q.trim().toLowerCase())

  const pages = [...nav.vault, ...nav.shared, nav.settings].filter((l) => match(l.label))
  const creates = nav.create.filter((l) => match(l.label))
  const hasItems = !!data && (data.credentials.length > 0 || data.notes.length > 0)

  return (
    <Command shouldFilter={false} loop className="rounded-none">
      <CommandInput value={q} onValueChange={setQ} placeholder={t.shell.commandPlaceholder} />
      <CommandList>
        {q.trim().length >= 2 && !hasItems && pages.length === 0 && creates.length === 0 && !isFetching && (
          <CommandEmpty>{t.shell.noResults}</CommandEmpty>
        )}

        {debounced.length >= 2 && (isFetching && !data ? (
          <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t.common.loading}
          </div>
        ) : hasItems && (
          <CommandGroup heading={t.shell.items}>
            {data!.credentials.slice(0, 6).map((c) => {
              const meta = credentialMeta(c.type)
              return (
                <CommandItem key={`c-${c.id}`} value={`c-${c.id}`} onSelect={() => go(`/credentials/${c.id}`)}>
                  <ItemTile icon={meta.icon} tone={meta.tone} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.username ?? c.email ?? meta.label}</span>
                  </span>
                </CommandItem>
              )
            })}
            {data!.notes.slice(0, 4).map((n) => {
              const meta = noteMeta(n.type)
              return (
                <CommandItem key={`n-${n.id}`} value={`n-${n.id}`} onSelect={() => go(`/notes/${n.id}`)}>
                  <ItemTile icon={meta.icon} tone={meta.tone} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{t.nav.notes}</span>
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}

        {pages.length > 0 && (
          <CommandGroup heading={t.shell.goTo}>
            {pages.map(({ href, label, icon: Icon }) => (
              <CommandItem key={href} value={href} onSelect={() => go(href)}>
                <Icon className="text-muted-foreground" aria-hidden="true" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {creates.length > 0 && (
          <CommandGroup heading={t.shell.create}>
            {creates.map(({ href, label, icon: Icon }) => (
              <CommandItem key={href} value={href} onSelect={() => go(href)}>
                <Icon className="text-muted-foreground" aria-hidden="true" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {q.trim() === '' && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t.shell.preferences}>
              <CommandItem value="theme-light" onSelect={() => { setTheme('light'); onDone() }}>
                <Sun className="text-muted-foreground" aria-hidden="true" />{t.shell.theme}: {t.shell.light}
              </CommandItem>
              <CommandItem value="theme-dark" onSelect={() => { setTheme('dark'); onDone() }}>
                <Moon className="text-muted-foreground" aria-hidden="true" />{t.shell.theme}: {t.shell.dark}
              </CommandItem>
              <CommandItem value="theme-system" onSelect={() => { setTheme('system'); onDone() }}>
                <Monitor className="text-muted-foreground" aria-hidden="true" />{t.shell.theme}: {t.shell.system}
              </CommandItem>
              <CommandItem value="lang" onSelect={() => { setLang(lang === 'en' ? 'id' : 'en'); onDone() }}>
                <Languages className="text-muted-foreground" aria-hidden="true" />
                {t.shell.language}: {lang === 'en' ? 'Bahasa Indonesia' : 'English'}
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
      <div className="flex items-center justify-between gap-3 border-t bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <Kbd>↑</Kbd><Kbd>↓</Kbd> to move <Kbd>↵</Kbd> to open
        </span>
        <span className="inline-flex items-center gap-1.5"><Kbd>Esc</Kbd> to close</span>
      </div>
    </Command>
  )
}
