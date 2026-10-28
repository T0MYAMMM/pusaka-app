'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Check, ChevronDown, Clock, Copy, Crown, Eye, EyeOff, FolderArchive, Globe, KeyRound,
  Landmark, Loader2, Lock, Server, Shield, StickyNote, Terminal, User, Users, IdCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo, LogoMark } from '@/components/brand/logo'
import { ItemTile } from '@/components/shared/item-tile'
import { SecretText } from '@/components/shared/secret-text'
import { StatusPill } from '@/components/shared/badges'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/** One container rhythm for every section. */
const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8'
const SECTION = 'py-20 sm:py-24 lg:py-28'

const NAV_LINKS = [
  { href: '#keep', label: 'What you keep' },
  { href: '#share', label: 'Sharing' },
  { href: '#developers', label: 'For developers' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

// ─── Nav ─────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className={`${CONTAINER} flex h-16 items-center justify-between gap-4`}>
        <Link href="/" className="rounded-lg" aria-label="Pusaka home">
          <Logo />
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-7 text-sm font-medium md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="rounded-sm text-muted-foreground transition-colors hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-9">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="h-9">
            <Link href="/register">Start free</Link>
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

function HeroVault() {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="kawung relative overflow-hidden rounded-[1.75rem] bg-[#1E2560] p-5 [--kawung-color:rgba(217,174,85,0.16)] [--kawung-size:56px] sm:p-8">
      <div className="mb-5 flex items-center gap-3 text-white">
        <LogoMark className="size-10" animated tile={false} />
        <div>
          <p className="text-sm font-semibold">Brankas keluarga Wulandari</p>
          <p className="text-xs text-white/60">18 items · encrypted</p>
        </div>
      </div>

      {/* Credential card */}
      <div className="rounded-2xl bg-card p-1 text-card-foreground shadow-2xl shadow-black/30">
        <div className="flex items-center gap-3 px-4 pb-3 pt-4">
          <ItemTile icon={Landmark} tone="jade" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">BCA KlikPay</p>
            <p className="truncate text-xs text-muted-foreground">klikbca.com</p>
          </div>
          <StatusPill tone="success">Strong</StatusPill>
        </div>
        <div className="divide-y rounded-xl border bg-background/60">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Username</p>
              <p className="mt-0.5 text-sm font-semibold">sariwulan</p>
            </div>
            <Copy className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Password</p>
              <p className="mt-0.5 min-h-6 text-[0.9375rem]" aria-live="polite">
                <SecretText value="Bca#2024!keluarga" revealed={revealed} />
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-pressed={revealed}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors hover:bg-accent"
            >
              {revealed ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
              {revealed ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </div>

      {/* Two quieter items underneath */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.08] p-3 text-white">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <IdCard className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">KTP — Sari</p>
            <p className="truncate font-mono text-[0.6875rem] text-white/60">ktp-sari.pdf · 1.2&nbsp;MB</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.08] p-3 text-white">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#D9AE55]/20">
            <Clock className="size-4 text-[#EBC97E]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Stripe live key</p>
            <p className="truncate text-[0.6875rem] text-white/60">Expires in 9 days</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
      <div className={`${CONTAINER} grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16`}>
        <div className="min-w-0">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[0.8125rem] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brass" aria-hidden="true" />
            Brankas digital keluarga Indonesia
          </p>
          <h1 className="text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4.25rem]" lang="id">
            Simpan dengan tenang. Jaga dengan bangga.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Pusaka keeps the passwords, private notes and documents your family and team can’t afford to lose —
            encrypted, organised, and there when you need them.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="sm:w-auto">
              <Link href="/register">Create your vault</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="sm:w-auto">
              <a href="#keep">See what it keeps</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {['Free for up to 100 credentials', 'No card needed', 'English & Bahasa Indonesia'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <HeroVault />
      </div>
    </section>
  )
}

// ─── What you keep ───────────────────────────────────────────────────

const KEEPS = [
  {
    icon: KeyRound,
    tone: 'indigo' as const,
    title: 'Passwords and logins',
    body: 'Bank, email, marketplace, the family Wi-Fi. Generate strong passwords, spot ones you reuse, and copy with a clipboard that clears itself after 30 seconds.',
    examples: ['BCA KlikPay', 'Gmail', 'Tokopedia', 'Wi-Fi rumah'],
  },
  {
    icon: StickyNote,
    tone: 'brass' as const,
    title: 'Secure notes',
    body: 'The things that don’t fit a password field: insurance policy numbers, recovery codes, a server’s SSH key — or Nenek’s rendang recipe.',
    examples: ['Nomor polis', 'Recovery codes', 'SSH keys'],
  },
  {
    icon: FolderArchive,
    tone: 'jade' as const,
    title: 'Important documents',
    body: 'Scans of KTP, passport, ijazah and policies, encrypted and searchable by type — with expiry dates so a renewal never sneaks up on you.',
    examples: ['KTP', 'Paspor', 'Ijazah', 'Polis asuransi'],
  },
]

function Keep() {
  return (
    <section id="keep" className={cn(SECTION, 'border-t')}>
      <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
            One vault for the things that matter.
          </h2>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">
            A pusaka is an heirloom — something kept with care and handed on. Your digital life deserves the same.
          </p>
        </div>
        <ul className="divide-y rounded-2xl border bg-card">
          {KEEPS.map(({ icon, tone, title, body, examples }) => (
            <li key={title} className="flex gap-5 p-6 sm:p-8">
              <ItemTile icon={icon} tone={tone} size="lg" />
              <div className="min-w-0 space-y-3">
                <h3 className="text-lg font-bold tracking-[-0.01em]">{title}</h3>
                <p className="max-w-prose text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">{body}</p>
                <ul className="flex flex-wrap gap-1.5" aria-label="Examples">
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

const ROLES = [
  { name: 'Ibu Sari', role: 'Owner', icon: Crown, note: 'Manages the vault and its members', tone: 'brass' as const },
  { name: 'Pak Budi', role: 'Admin', icon: Shield, note: 'Adds and removes shared items', tone: 'indigo' as const },
  { name: 'Dimas', role: 'Member', icon: User, note: 'Uses what is shared with him', tone: 'jade' as const },
  { name: 'Akuntan keluarga', role: 'Viewer', icon: Eye, note: 'Can see, cannot change', tone: 'slate' as const },
]

function Share() {
  return (
    <section id="share" className={cn(SECTION, 'bg-card/60 border-y')}>
      <div className={`${CONTAINER} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border bg-card p-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <ItemTile icon={Users} tone="indigo" size="sm" />
                <p className="font-semibold">Rekening keluarga</p>
              </div>
              <span className="text-xs text-muted-foreground">4 members</span>
            </div>
            <ul className="divide-y rounded-xl border bg-background/60">
              {ROLES.map(({ name, role, icon: Icon, note, tone }) => (
                <li key={name} className="flex items-center gap-3 px-4 py-3">
                  <ItemTile icon={Icon} tone={tone} size="sm" />
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
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
            Share access, not passwords in WhatsApp.
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-muted-foreground">
            Create a shared vault for the household or the team, invite people by email and give each of them a role.
            When someone no longer needs access, remove them — nothing was ever pasted into a chat.
          </p>
          <ul className="mt-8 space-y-3 text-[0.9375rem]">
            {[
              'Four roles: owner, admin, member and viewer',
              'Invitations by email, accepted with one link',
              'Every view, change and export recorded in the activity log',
            ].map((t) => (
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

const DEV_FEATURES = [
  { icon: Globe, title: 'Environment labels', body: 'Tag each secret dev, staging, prod or global and filter by it in the app or the CLI.' },
  { icon: Clock, title: 'Expiry tracking', body: 'Set dates on keys and certificates; Pusaka warns you 14 days ahead.' },
  { icon: KeyRound, title: 'Scoped API keys', body: 'Read-only or read-write keys for CI. Only a hash is stored; revoke any time.' },
  { icon: Terminal, title: 'Pipe-friendly CLI', body: '`cm get` prints the bare value — ready for shell substitution in scripts.' },
]

function Developers() {
  return (
    <section id="developers" className="kawung kawung-fade-b bg-[#141A3D] py-20 text-white [--kawung-color:rgba(217,174,85,0.08)] [--kawung-size:56px] sm:py-24 lg:py-28 dark:bg-[#0A0D1E]">
      <div className={`${CONTAINER} grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16`}>
        <div>
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#EBC97E]">
            <Server className="size-4" aria-hidden="true" />
            Also built for developers
          </p>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
            The same vault, in your terminal and your pipeline.
          </h2>
          <dl className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {DEV_FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <dt className="flex items-center gap-2 font-semibold">
                  <Icon className="size-4 text-[#EBC97E]" aria-hidden="true" />
                  {title}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-white/70">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E22] shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="ml-2 font-mono text-xs text-white/50">~/projects/toko</span>
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

const STEPS = [
  { title: 'Create your vault', body: 'Sign up with a strong password. Pusaka generates a vault key just for you and locks it with that password.' },
  { title: 'Add what matters', body: 'Save logins, write secure notes and upload documents. Tag them, star favorites, set expiry dates.' },
  { title: 'Share when you’re ready', body: 'Invite family or teammates into a shared vault and give each of them a role.' },
]

function HowItWorks() {
  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">Ready in a few minutes.</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map(({ title, body }, i) => (
            <li key={title} className="border-t-2 border-primary pt-5">
              <p className="text-sm font-bold text-primary tabular">Step {i + 1}</p>
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

const SECURITY = [
  { term: 'A key per person', detail: 'Every account gets its own random vault key. It is locked with a key derived from your password using PBKDF2-SHA256 at 600,000 iterations.' },
  { term: 'Encrypted before storage', detail: 'Passwords, secret keys, notes and documents are encrypted with Fernet (AES) before they reach the database.' },
  { term: 'Sessions you can’t steal from JavaScript', detail: 'Sign-in tokens live in httpOnly cookies, and account passwords are hashed with bcrypt.' },
  { term: 'Exports without secrets', detail: 'CSV exports include labels and usernames, never passwords or secret keys.' },
]

function Security() {
  return (
    <section className={cn(SECTION, 'border-t')}>
      <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">How your vault is protected.</h2>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">Plainly stated, so you can judge it yourself.</p>
        </div>
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {SECURITY.map(({ term, detail }) => (
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

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For one person getting organised.',
    features: ['100 credentials', 'Secure notes and documents', 'CLI and API keys', '30-day activity log'],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    price: '$6',
    period: 'per month',
    description: 'For when your vault outgrows the free plan.',
    features: ['Unlimited credentials', 'Full activity log', 'Reused-password detection', 'Priority support'],
    cta: 'Start with Pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$8',
    period: 'per user / month',
    description: 'For households and teams that share.',
    features: ['Everything in Pro', 'Up to 25 people', 'Shared vaults', 'Owner, admin, member and viewer roles'],
    cta: 'Start a team vault',
  },
]

function Pricing() {
  return (
    <section id="pricing" className={cn(SECTION, 'bg-card/60 border-y')}>
      <div className={CONTAINER}>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">Start free. Upgrade when you need to.</h2>
          <p className="mt-4 text-muted-foreground">Every plan includes encryption, the CLI and the activity log. Cancel any time.</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-7',
                plan.highlight && 'border-primary ring-1 ring-primary',
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                  Recommended
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

const FAQS = [
  {
    q: 'Can Pusaka staff read my passwords?',
    a: 'Your items are encrypted with your personal vault key, which is locked with your password. The server unlocks it while you are signed in so it can show you your items. To support password reset, a recovery copy of the key is also kept, encrypted with the server’s secret — so Pusaka is not a zero-knowledge system, and we don’t claim it is.',
  },
  {
    q: 'What happens if I forget my password?',
    a: 'Reset it by email. Your vault key is recovered and re-locked with your new password, so nothing in your vault is lost.',
  },
  {
    q: 'How do shared vaults work?',
    a: 'When you add an item to a shared vault, a copy is encrypted with that vault’s own key. Everyone you invite reads that copy according to their role. Removing someone ends their access.',
  },
  {
    q: 'Can I self-host Pusaka?',
    a: 'Yes. The backend is a FastAPI app that runs on PostgreSQL and is configured with environment variables; the web app is a Next.js front end that talks to it over a REST API.',
  },
  {
    q: 'How do API keys work for CI/CD?',
    a: 'Create a read or read-write key in Settings → Security, store it as a CI secret, and send it as a Bearer token. Only a SHA-256 hash of the key is stored, and you can revoke it instantly.',
  },
  {
    q: 'Is there a rate limit?',
    a: 'Sign-in is limited to 10 attempts per minute per IP and registration to 5 per hour. Other authenticated requests are not throttled.',
  },
]

function FAQ() {
  return (
    <section id="faq" className={SECTION}>
      <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">Questions people ask first.</h2>
        <div className="divide-y rounded-2xl border bg-card">
          {FAQS.map(({ q, a }) => (
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

function ClosingCTA() {
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
      if (!res.ok) throw new Error(data?.detail ?? 'That didn’t work. Check the address and try again.')
      setSubmitted(true)
      toast.success(data.detail)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not join the list. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-5 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="kawung kawung-fade-r mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-[#1E2560] px-6 py-14 text-white [--kawung-color:rgba(217,174,85,0.16)] [--kawung-size:56px] sm:px-12 sm:py-16 dark:bg-[#161B45]">
        <div className="max-w-xl">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">Start keeping what matters.</h2>
          <p className="mt-4 text-pretty text-white/75">Free for up to 100 credentials, with notes and documents included. No card needed.</p>
          <Button size="lg" asChild className="mt-8 bg-[#EBC97E] text-[#1E2560] hover:bg-[#F1D597]">
            <Link href="/register">Create your vault</Link>
          </Button>

          <div className="mt-10 border-t border-white/15 pt-8" aria-live="polite">
            <p className="text-sm font-semibold">Hear about new features</p>
            {submitted ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-[#EBC97E]">
                <Check className="size-4" aria-hidden="true" />
                You’re on the list. We’ll write when there’s news.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3 flex max-w-md gap-2">
                <label htmlFor="waitlist-email" className="sr-only">Email address</label>
                <Input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="border-white/25 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-[#EBC97E] focus-visible:ring-[#EBC97E]/30"
                />
                <Button type="submit" variant="outline" disabled={loading || !email} className="shrink-0 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {loading ? 'Joining…' : 'Notify me'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t py-10">
      <div className={`${CONTAINER} flex flex-col items-start justify-between gap-6 text-sm text-muted-foreground sm:flex-row sm:items-center`}>
        <div className="flex items-center gap-3">
          <LogoMark className="size-7" />
          <span>Pusaka — dibuat dengan bangga di Indonesia.</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/register" className="rounded-sm transition-colors hover:text-foreground">Create account</Link>
          <Link href="/login" className="rounded-sm transition-colors hover:text-foreground">Sign in</Link>
          <a href="#pricing" className="rounded-sm transition-colors hover:text-foreground">Pricing</a>
          <a href="#faq" className="rounded-sm transition-colors hover:text-foreground">FAQ</a>
        </nav>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Keep />
        <Share />
        <Developers />
        <HowItWorks />
        <Security />
        <Pricing />
        <FAQ />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  )
}

