'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ShieldCheck, Terminal, Users, Key, Lock, Zap, ChevronDown, ChevronUp,
  Globe, GitBranch, Clock, ArrowRight, Check, Star, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/**
 * One container rhythm for every landing section: same max width, same
 * gutters. Sections that want narrower copy nest a second max-width
 * inside instead of shrinking the outer container, so the horizontal
 * gutter never shifts between sections.
 */
const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8'

/** Vertical rhythm shared by every section. */
const SECTION = 'py-16 sm:py-20 lg:py-24'

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-sm">
      <div className={`${CONTAINER} flex h-16 items-center justify-between gap-4`}>
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-serif text-xl font-bold tracking-wide"
        >
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          Pusaka
        </Link>
        <nav aria-label="Sections" className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

const CLI_DEMO = `$ cm login
Username: alice
Password: ••••••••
Logged in. API key stored: cmv1_a3f9… (scope: read)

$ cm list --env prod
  ID  LABEL                  TYPE    ENV   USERNAME
----  ---------------------  ------  ----  --------
   1  Production DB          server  prod  admin
   2  Stripe Live Key        api     prod
   3  AWS Deploy Token       api     prod  deploy-bot

$ cm get "Production DB"
hunter2

$ cm expiring --days 14
Credentials expiring within 14 days:
   2  Stripe Live Key        expires: 2026-03-20`

const HERO_PROOF = [
  'No credit card required',
  '100 credentials free forever',
  'Open API',
]

function Hero() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
      {/* subtle background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,currentColor 39px,currentColor 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,currentColor 39px,currentColor 40px)',
        }}
      />

      <div className={`${CONTAINER} relative`}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Left — copy */}
          <div className="min-w-0 space-y-6">
            <Badge variant="outline" className="gap-1.5">
              <Star className="h-3 w-3 fill-primary text-primary" aria-hidden="true" />
              End-to-end encrypted · Free to start
            </Badge>

            <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Pusaka<br />
              <span className="text-primary">built for developers</span>
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Store secrets with environment labels, track expiry, share vaults with your team,
              and inject credentials in CI/CD — all from a single encrypted vault.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/register" className="sm:w-auto">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <a href="#how-it-works" className="sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  See how it works
                </Button>
              </a>
            </div>

            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {HERO_PROOF.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — terminal demo. Deliberately dark in both themes: it is
              terminal chrome, not a surface, so it keeps its own palette. */}
          <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="ml-2 font-mono text-xs text-zinc-400">terminal</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre p-4 font-mono text-xs leading-relaxed text-emerald-300 sm:p-5">
              {CLI_DEMO}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Trust bar
// ---------------------------------------------------------------------------

function TrustBar() {
  const items = [
    { icon: Lock, label: 'PBKDF2 + Fernet encryption' },
    { icon: Key, label: 'Per-user vault keys' },
    { icon: Globe, label: 'Environment-aware (dev/staging/prod)' },
    { icon: GitBranch, label: 'CI/CD credential injection' },
    { icon: Clock, label: 'Expiry tracking & alerts' },
  ]
  return (
    <section className="border-y bg-muted/40 py-6">
      <div className={CONTAINER}>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 sm:gap-x-8">
          {items.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

/**
 * Icon chips rotate through the three palette accents rather than a
 * six-colour rainbow, so the grid stays calm and re-themes with the tokens.
 */
const ACCENTS = {
  sage: 'bg-sage/10 text-sage',
  mist: 'bg-mist/10 text-mist',
  clay: 'bg-clay/10 text-clay',
} as const

const FEATURES = [
  {
    icon: Lock,
    title: 'Zero-knowledge encryption',
    description:
      'Your vault is encrypted with a key derived from your password using PBKDF2 (600k iterations). The server never sees your plaintext credentials — not even for support.',
    accent: ACCENTS.sage,
  },
  {
    icon: Terminal,
    title: 'Developer-native CLI',
    description:
      'The `cm` CLI lets you inject secrets into any script or CI pipeline. `cm get "DB_PASSWORD"` pipes clean output with no trailing newline — ready for shell substitution.',
    accent: ACCENTS.mist,
  },
  {
    icon: Globe,
    title: 'Environment labels',
    description:
      'Tag every credential with dev, staging, prod, or global. Filter by environment in the UI or `cm list --env prod`. Know exactly what runs where.',
    accent: ACCENTS.clay,
  },
  {
    icon: Users,
    title: 'Team vaults & RBAC',
    description:
      'Create shared vaults for your team with fine-grained roles: owner, admin, member, viewer. Credentials are re-encrypted with a shared vault key — no individual key sharing.',
    accent: ACCENTS.sage,
  },
  {
    icon: Clock,
    title: 'Expiry tracking',
    description:
      'Set an expiry date on API keys, certificates, and tokens. Get warned 14 days out. Run `cm expiring --days 30` in your alerting pipeline.',
    accent: ACCENTS.mist,
  },
  {
    icon: Key,
    title: 'Scoped API keys',
    description:
      'Generate read-only or read-write API keys for CI/CD. Keys use SHA-256 hashing — only the prefix is stored. Revoke instantly from the web UI.',
    accent: ACCENTS.clay,
  },
]

function SectionHeading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {lead && <p className="text-pretty text-base text-muted-foreground sm:text-lg">{lead}</p>}
    </div>
  )
}

function Features() {
  return (
    <section id="features" className={SECTION}>
      <div className={`${CONTAINER} space-y-10 sm:space-y-12`}>
        <SectionHeading
          title="Built for the way developers actually work"
          lead="Not another generic password manager — every feature is designed for dev team workflows."
        />
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, accent }) => (
            <div
              key={title}
              className="space-y-4 rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className={`inline-flex rounded-lg p-2.5 ${accent}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

const STEPS = [
  {
    step: '01',
    title: 'Store once',
    description: 'Add credentials in the web UI or via the CLI. Tag with environment, set expiry, mark favorites.',
    code: 'cm set "DB_PASSWORD" s3cr3t --env prod --type server',
  },
  {
    step: '02',
    title: 'Access anywhere',
    description: 'Pull secrets in CI scripts, Docker entrypoints, or shell sessions. Pipe-friendly with no trailing newline.',
    code: 'export DB_PASS=$(cm get "DB_PASSWORD")',
  },
  {
    step: '03',
    title: 'Share with your team',
    description: 'Invite teammates to an org, create shared vaults, and control access with roles. Everyone gets their own encrypted view.',
    code: 'cm login --scope read\n# → saves scoped API key to ~/.cm/config.json',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className={`${SECTION} bg-muted/30`}>
      <div className={`${CONTAINER} space-y-10 sm:space-y-12`}>
        <SectionHeading title="Up and running in minutes" lead="Install once, use everywhere." />
        <ol className="grid gap-8 lg:grid-cols-3">
          {/* min-w-0: grid items default to min-width:auto, which lets the
              long <pre> below push the whole track past the viewport. */}
          {STEPS.map(({ step, title, description, code }) => (
            <li key={step} className="min-w-0 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-4xl font-bold text-primary/25">{step}</span>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              <pre className="overflow-x-auto whitespace-pre rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300">
                {code}
              </pre>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For solo developers getting started.',
    features: [
      '100 credentials',
      '1 user',
      'API key access',
      'CLI tool',
      '30-day activity log',
    ],
    cta: 'Start free',
    href: '/register',
    variant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: '$6',
    period: '/month',
    description: 'For power users who need unlimited storage.',
    features: [
      'Unlimited credentials',
      '1 user',
      'Full activity log',
      'Duplicate password detection',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    href: '/register',
    variant: 'default' as const,
    highlight: true,
  },
  {
    name: 'Team',
    price: '$8',
    period: '/user/month',
    description: 'For teams that need shared vaults.',
    features: [
      'Everything in Pro',
      'Up to 25 users',
      'Shared vaults',
      'RBAC roles (owner/admin/member/viewer)',
      'Audit trail',
    ],
    cta: 'Start team trial',
    href: '/register',
    variant: 'outline' as const,
  },
]

function Pricing() {
  return (
    <section id="pricing" className={SECTION}>
      <div className={`${CONTAINER} space-y-10 sm:space-y-12`}>
        <SectionHeading
          title="Simple, transparent pricing"
          lead="Start free. Upgrade when your team does."
        />
        <div className="mx-auto grid max-w-5xl gap-5 sm:gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col gap-6 rounded-xl border bg-card p-6 sm:p-7 ${
                plan.highlight ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''
              }`}
            >
              <Badge className={`self-start text-[11px] ${plan.highlight ? '' : 'invisible'}`}>
                Most popular
              </Badge>
              <div>
                <p className="text-lg font-semibold">{plan.name}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className="block">
                <Button variant={plan.variant} className="w-full">{plan.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
          All plans include end-to-end encryption, CLI access, and API key auth. Cancel any time.
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQS = [
  {
    q: 'How does the encryption work?',
    a: 'Each user gets a unique random vault key. That key is encrypted with a wrapping key derived from your password using PBKDF2 (600,000 iterations, SHA-256). The server stores only the encrypted vault key — your plaintext credentials are never visible to us, even if our database is breached.',
  },
  {
    q: 'What happens if I forget my password?',
    a: 'We support password reset via email. When you reset your password, we re-derive the wrapping key and re-encrypt your vault key — your vault data is preserved. This requires the recovery-encrypted vault key stored on the server.',
  },
  {
    q: 'How do shared team vaults work?',
    a: 'Shared vaults use a server-derived key (HMAC-SHA256 of the server secret and vault ID). When you share a credential, it is decrypted with your personal key and re-encrypted with the shared vault key. All vault members decrypt with the same shared key. This is a server-assisted sharing model.',
  },
  {
    q: 'Can I self-host Pusaka?',
    a: 'Yes — the backend is a standard FastAPI + PostgreSQL app. All configuration is via environment variables. The Docker setup is straightforward. Self-hosted instances are fully supported and the code is open.',
  },
  {
    q: 'How do API keys work for CI/CD?',
    a: 'API keys use the format cmv1_<64-hex>. Only the SHA-256 hash is stored on the server. You create a read or write scoped key from the web UI, store it as a CI secret, and use it as a Bearer token: Authorization: Bearer cmv1_...',
  },
  {
    q: 'Is there a rate limit on the API?',
    a: 'Login is rate-limited to 10 attempts per minute per IP. Registration is limited to 5 per hour. All other endpoints are unthrottled for authenticated requests.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className={`${SECTION} bg-muted/30`}>
      <div className={`${CONTAINER} space-y-10`}>
        <SectionHeading title="Frequently asked questions" />
        <div className="mx-auto max-w-2xl space-y-2">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = open === i
            return (
              <div key={q} className="overflow-hidden rounded-lg border bg-background">
                <h3>
                  <button
                    type="button"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-muted/50"
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    {q}
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${i}`}
                    className="border-t px-5 pb-4 pt-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    {a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Waitlist / CTA
// ---------------------------------------------------------------------------

function WaitlistCTA() {
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
      if (!res.ok) throw new Error(data?.detail ?? 'Something went wrong')
      setSubmitted(true)
      toast.success(data.detail)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join waitlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={SECTION}>
      <div className={`${CONTAINER} text-center`}>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="inline-flex rounded-full bg-primary/10 p-3">
            <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to secure your secrets?
          </h2>
          <p className="text-pretty text-base text-muted-foreground sm:text-lg">
            Start free today — no credit card required. Or join the waitlist for early access to new features.
          </p>
          <div className="flex justify-center">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                Create free account <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
          <div className="relative">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">
                or join the waitlist for updates
              </span>
            </div>
          </div>
          <div aria-live="polite">
            {submitted ? (
              <p className="flex items-center justify-center gap-2 text-sm text-primary">
                <Check className="h-4 w-4" aria-hidden="true" />
                You&apos;re on the list! We&apos;ll be in touch.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm gap-2">
                <label htmlFor="waitlist-email" className="sr-only">Email address</label>
                <Input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button type="submit" variant="outline" disabled={loading || !email} className="shrink-0">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span className="sr-only">Joining the waitlist</span>
                    </>
                  ) : (
                    'Join'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <footer className="border-t py-10">
      <div
        className={`${CONTAINER} flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row`}
      >
        <p className="flex items-center gap-2 text-center sm:text-left">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Pusaka — secure credentials for developers</span>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/register" className="rounded-sm transition-colors hover:text-foreground">Get started</Link>
          <Link href="/login" className="rounded-sm transition-colors hover:text-foreground">Sign in</Link>
          <a href="#pricing" className="rounded-sm transition-colors hover:text-foreground">Pricing</a>
          <a href="#faq" className="rounded-sm transition-colors hover:text-foreground">FAQ</a>
        </nav>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <TrustBar />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <WaitlistCTA />
      </main>
      <Footer />
    </div>
  )
}
