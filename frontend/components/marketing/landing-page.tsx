'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Check, ChevronDown, Clock, Copy, Crown, Eye, EyeOff, FolderArchive, Globe, IdCard, KeyRound,
  Landmark, Loader2, Lock, Server, Shield, StickyNote, Terminal, User, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo, LogoMark } from '@/components/brand/logo'
import { ItemTile } from '@/components/shared/item-tile'
import { SecretText } from '@/components/shared/secret-text'
import { StatusPill } from '@/components/shared/badges'
import { cn } from '@/lib/utils'
import { useT, type Lang } from '@/lib/i18n'
import { LANDING_COPY, type LandingCopy } from './landing-copy'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/** One container rhythm for every section. */
const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8'
const SECTION = 'py-20 sm:py-24 lg:py-28'

/** Indigo panel with depth: lit surface + kawung motif on top. */
const NILA_PANEL = 'nila-surface kawung text-white [--kawung-color:rgba(217,174,85,0.14)] [--kawung-size:56px]'

// ─── Language switch ─────────────────────────────────────────────────

function LanguageSwitch({ label }: { label: string }) {
  const { lang, setLang } = useT()
  const choose = (l: Lang) => {
    setLang(l)
    // Keep the URL shareable: /?lang=id opens the Indonesian page.
    const url = new URL(window.location.href)
    url.searchParams.set('lang', l)
    window.history.replaceState(null, '', url)
  }
  return (
    <div role="group" aria-label={label} className="inline-flex h-9 items-center rounded-lg border bg-card p-0.5 text-xs font-bold">
      {(['en', 'id'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => choose(l)}
          lang={l}
          className={cn(
            'inline-flex h-full min-w-9 items-center justify-center rounded-md px-2 uppercase transition-colors',
            lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span aria-hidden="true">{l}</span>
          <span className="sr-only">{l === 'en' ? 'English' : 'Bahasa Indonesia'}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────────

function Nav({ c }: { c: LandingCopy }) {
  return (
    <header className="sticky top-0 z-40 bg-background/75 backdrop-blur-md">
      <div className={`${CONTAINER} flex h-16 items-center justify-between gap-3`}>
        <Link href="/" className="shrink-0 rounded-lg" aria-label="Pusaka">
          <Logo />
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {c.nav.links.map(({ href, label }) => (
            <a key={href} href={href} className="rounded-sm text-muted-foreground transition-colors hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitch label={c.nav.language} />
          <Button variant="ghost" size="sm" asChild className="hidden h-9 sm:inline-flex">
            <Link href="/login">{c.nav.signIn}</Link>
          </Button>
          <Button size="sm" asChild className="h-9">
            <Link href="/register">{c.nav.start}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────
// The characteristic moment of a vault is a secret being kept — and
// handed back when you ask. The hero shows exactly that, with the real
// item components, and lets the visitor reveal the password themselves.

function HeroVault({ c }: { c: LandingCopy['vault'] }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className={cn(NILA_PANEL, 'relative overflow-hidden rounded-[1.75rem] p-5 shadow-2xl shadow-[#141A44]/30 sm:p-8')}>
      {/* A second light pool right behind the card gives the frosted
          glass something to blur, so it reads as glass, not grey. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7A8AF0]/30 blur-3xl" />

      <div className="relative mb-5 flex items-center gap-3">
        <span className="glass inline-flex size-11 items-center justify-center rounded-xl">
          <LogoMark className="size-8" animated tile={false} />
        </span>
        <div>
          <p className="text-sm font-semibold">{c.name}</p>
          <p className="text-xs text-white/65">{c.meta}</p>
        </div>
      </div>

      {/* Credential card — light frosted glass */}
      <div className="glass-light relative rounded-2xl p-1 text-card-foreground">
        <div className="flex items-center gap-3 px-4 pb-3 pt-4">
          <ItemTile icon={Landmark} tone="jade" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">BCA KlikPay</p>
            <p className="truncate text-xs text-muted-foreground">klikbca.com</p>
          </div>
          <StatusPill tone="success">{c.strong}</StatusPill>
        </div>
        <div className="divide-y rounded-xl border bg-background/50">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{c.username}</p>
              <p className="mt-0.5 text-sm font-semibold">sariwulan</p>
            </div>
            <Copy className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{c.password}</p>
              <p className="mt-0.5 min-h-6 text-[0.9375rem]" aria-live="polite">
                <SecretText value="Bca#2024!keluarga" revealed={revealed} />
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-pressed={revealed}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-xs font-semibold transition-colors hover:bg-accent"
            >
              {revealed ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
              {revealed ? c.hide : c.show}
            </button>
          </div>
        </div>
      </div>

      {/* Two quieter items in tinted glass */}
      <div className="relative mt-3 grid gap-3 sm:grid-cols-2">
        <div className="glass flex items-center gap-3 rounded-xl p-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/12">
            <IdCard className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{c.docName}</p>
            <p className="truncate font-mono text-[0.6875rem] text-white/65" translate="no">ktp-sari.pdf</p>
          </div>
        </div>
        <div className="glass flex items-center gap-3 rounded-xl p-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#D9AE55]/25">
            <Clock className="size-4 text-[#F1D597]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{c.reminderName}</p>
            <p className="truncate text-[0.6875rem] text-white/65">{c.reminder}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero({ c, vault }: { c: LandingCopy['hero']; vault: LandingCopy['vault'] }) {
  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pb-24 sm:pt-14 lg:pb-28 lg:pt-20">
      <div className={`${CONTAINER} grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16`}>
        <div className="min-w-0">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[0.8125rem] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brass" aria-hidden="true" />
            {c.badge}
          </p>
          <h1 className="text-[2.6rem] font-extrabold leading-[1.03] tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4.1rem]">
            {c.title}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">{c.lead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">{c.primary}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#keep">{c.secondary}</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {c.proof.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <HeroVault c={vault} />
      </div>
    </section>
  )
}

// ─── What it keeps ───────────────────────────────────────────────────

const KEEP_VISUALS = [
  { icon: KeyRound, tone: 'indigo' as const },
  { icon: StickyNote, tone: 'brass' as const },
  { icon: FolderArchive, tone: 'jade' as const },
]

function Keep({ c }: { c: LandingCopy['keep'] }) {
  return (
    <section id="keep" className={cn(SECTION, 'border-t')}>
      <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{c.title}</h2>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">{c.lead}</p>
        </div>
        <ul className="divide-y rounded-2xl border bg-card">
          {c.items.map(({ title, body, examples }, i) => (
            <li key={title} className="flex gap-5 p-6 sm:p-8">
              <ItemTile icon={KEEP_VISUALS[i].icon} tone={KEEP_VISUALS[i].tone} size="lg" />
              <div className="min-w-0 space-y-3">
                <h3 className="text-lg font-bold tracking-[-0.01em]">{title}</h3>
                <p className="max-w-prose text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">{body}</p>
                <ul className="flex flex-wrap gap-1.5" aria-label={c.examplesLabel}>
                  {examples.map((e) => (
                    <li key={e} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{e}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─── Sharing ─────────────────────────────────────────────────────────

const ROLE_VISUALS = [
  { icon: Crown, tone: 'brass' as const },
  { icon: Shield, tone: 'indigo' as const },
  { icon: User, tone: 'jade' as const },
  { icon: Eye, tone: 'slate' as const },
]

function Share({ c }: { c: LandingCopy['share'] }) {
  return (
    <section id="share" className={cn(SECTION, 'border-y bg-card/60')}>
      <div className={`${CONTAINER} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border bg-card p-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <ItemTile icon={Users} tone="indigo" size="sm" />
                <p className="font-semibold">{c.vault}</p>
              </div>
              <span className="text-xs text-muted-foreground">{c.members}</span>
            </div>
            <ul className="divide-y rounded-xl border bg-background/60">
              {c.roles.map(({ name, role, note }, i) => (
                <li key={name} className="flex items-center gap-3 px-4 py-3">
                  <ItemTile icon={ROLE_VISUALS[i].icon} tone={ROLE_VISUALS[i].tone} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{note}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{c.title}</h2>
          <p className="mt-4 max-w-lg text-pretty text-muted-foreground">{c.body}</p>
          <ul className="mt-8 space-y-3 text-[0.9375rem]">
            {c.points.map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ─── For developers ──────────────────────────────────────────────────

const CLI_DEMO = `$ cm login
Username: sari
Password: ••••••••
Logged in. API key stored (scope: read)

$ cm list --env prod
  ID  LABEL              TYPE    ENV   USERNAME
   4  Production DB      server  prod  admin
   5  Stripe Live Key    api     prod

$ export DB_PASS=$(cm get "Production DB")

$ cm expiring --days 14
   5  Stripe Live Key    expires: 2026-11-06`

const DEV_ICONS = [Globe, Clock, KeyRound, Terminal]

/** Renders `backticked` fragments of copy as inline code. */
function WithCode({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') ? (
          <code key={i} className="rounded bg-white/12 px-1 py-0.5 font-mono text-[0.8125em] text-white" translate="no">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  )
}

function Developers({ c }: { c: LandingCopy['developers'] }) {
  return (
    <section id="developers" className={cn(NILA_PANEL, 'relative overflow-hidden py-20 sm:py-24 lg:py-28')}>
      <div className={`${CONTAINER} relative grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16`}>
        <div>
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#F1D597]">
            <Server className="size-4" aria-hidden="true" />
            {c.eyebrow}
          </p>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{c.title}</h2>
          <dl className="mt-10 grid gap-3 sm:grid-cols-2">
            {c.features.map(({ title, body }, i) => {
              const Icon = DEV_ICONS[i]
              return (
                <div key={title} className="glass rounded-xl p-4">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 text-[#F1D597]" aria-hidden="true" />
                    {title}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-white/75"><WithCode text={body} /></dd>
                </div>
              )
            })}
          </dl>
        </div>
        <div className="glass-deep min-w-0 overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="size-2.5 rounded-full bg-white/25" />
            <span className="size-2.5 rounded-full bg-white/18" />
            <span className="size-2.5 rounded-full bg-white/12" />
            <span className="ml-2 font-mono text-xs text-white/55">~/projects/toko</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[0.8125rem] leading-relaxed text-[#C9D0FF]" translate="no">
            {CLI_DEMO}
          </pre>
        </div>
      </div>
    </section>
  )
}

// ─── How it works (a real sequence, so it is numbered) ────────────────

function HowItWorks({ c }: { c: LandingCopy['how'] }) {
  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{c.title}</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {c.steps.map(({ title, body }, i) => (
            <li key={title} className="border-t-2 border-primary pt-5">
              <p className="text-sm font-bold text-primary tabular">{c.step} {i + 1}</p>
              <h3 className="mt-2 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ─── Security ────────────────────────────────────────────────────────

function Security({ c }: { c: LandingCopy['security'] }) {
  return (
    <section className={cn(SECTION, 'border-t')}>
      <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{c.title}</h2>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">{c.lead}</p>
        </div>
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {c.items.map(({ term, detail }) => (
            <div key={term}>
              <dt className="font-bold">{term}</dt>
              <dd className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

// ─── Pricing ─────────────────────────────────────────────────────────

function Pricing({ c }: { c: LandingCopy['pricing'] }) {
  return (
    <section id="pricing" className={cn(SECTION, 'border-y bg-card/60')}>
      <div className={CONTAINER}>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{c.title}</h2>
          <p className="mt-4 text-muted-foreground">{c.lead}</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {c.plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-7',
                plan.highlight && 'border-primary ring-1 ring-primary',
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                  {c.badge}
                </span>
              )}
              <p className="text-lg font-bold">{plan.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-[-0.03em] tabular">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-[0.9375rem]">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.highlight ? 'default' : 'outline'} className="mt-8 w-full">
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────

function FAQ({ c }: { c: LandingCopy['faq'] }) {
  return (
    <section id="faq" className={SECTION}>
      <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{c.title}</h2>
        <div className="divide-y rounded-2xl border bg-card">
          {c.items.map(({ q, a }) => (
            <details key={q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold">
                {q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-5 text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Closing CTA + waitlist ──────────────────────────────────────────

function ClosingCTA({ c }: { c: LandingCopy['cta'] }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/waitlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail ?? c.errorFallback)
      setSubmitted(true)
      toast.success(c.joined)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : c.errorFallback)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-5 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className={cn(NILA_PANEL, 'relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[1.75rem] px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1.1fr_1fr]')}>
        <div className="relative max-w-xl">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{c.title}</h2>
          <p className="mt-4 text-pretty text-white/80">{c.lead}</p>
          <Button size="lg" asChild className="mt-8 bg-[#EBC97E] text-[#1E2560] shadow-lg shadow-black/20 hover:bg-[#F1D597]">
            <Link href="/register">{c.button}</Link>
          </Button>
        </div>

        <div className="glass relative rounded-2xl p-6 sm:p-7" aria-live="polite">
          <p className="font-semibold">{c.waitlistTitle}</p>
          {submitted ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-[#F1D597]">
              <Check className="size-4 shrink-0" aria-hidden="true" />
              {c.joined}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="waitlist-email" className="sr-only">{c.emailLabel}</label>
              <Input
                id="waitlist-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder={c.placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="border-white/25 bg-white/10 text-white placeholder:text-white/55 focus-visible:border-[#EBC97E] focus-visible:ring-[#EBC97E]/30"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={loading || !email}
                className="shrink-0 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
                {loading ? c.joining : c.notify}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────

function Footer({ c }: { c: LandingCopy['footer'] }) {
  return (
    <footer className="border-t py-10">
      <div className={`${CONTAINER} flex flex-col items-start justify-between gap-6 text-sm text-muted-foreground sm:flex-row sm:items-center`}>
        <div className="flex items-center gap-3">
          <LogoMark className="size-7" />
          <span>{c.tagline}</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/register" className="rounded-sm transition-colors hover:text-foreground">{c.links.create}</Link>
          <Link href="/login" className="rounded-sm transition-colors hover:text-foreground">{c.links.signIn}</Link>
          <a href="#pricing" className="rounded-sm transition-colors hover:text-foreground">{c.links.pricing}</a>
          <a href="#faq" className="rounded-sm transition-colors hover:text-foreground">{c.links.faq}</a>
        </nav>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const { lang, setLang } = useT()
  const c = LANDING_COPY[lang]

  // `/?lang=id` or `/?lang=en` opens that version directly (shareable links).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('lang')
    if (requested === 'id' || requested === 'en') setLang(requested)
  }, [setLang])

  return (
    <div lang={lang} className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        {c.skip}
      </a>
      <Nav c={c} />
      <main id="main">
        <Hero c={c.hero} vault={c.vault} />
        <Keep c={c.keep} />
        <Share c={c.share} />
        <Developers c={c.developers} />
        <HowItWorks c={c.how} />
        <Security c={c.security} />
        <Pricing c={c.pricing} />
        <FAQ c={c.faq} />
        <ClosingCTA c={c.cta} />
      </main>
      <Footer c={c.footer} />
    </div>
  )
}
