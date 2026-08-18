'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ShieldCheck, Terminal, Users, Key, Lock, Zap, ChevronDown, ChevronUp,
  Globe, GitBranch, Clock, ArrowRight, Check, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Vault
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
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

function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* subtle background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,currentColor 39px,currentColor 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,currentColor 39px,currentColor 40px)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div className="space-y-6">
            <Badge variant="outline" className="gap-1.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              End-to-end encrypted · Free to start
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Credentials manager<br />
              <span className="text-primary">built for developers</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Store secrets with environment labels, track expiry, share vaults with your team,
              and inject credentials in CI/CD — all from a single encrypted vault.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline">See how it works</Button>
              </a>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> 100 credentials free forever</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Open API</span>
            </div>
          </div>

          {/* Right — terminal demo */}
          <div className="rounded-xl border bg-zinc-950 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-zinc-500 font-mono">terminal</span>
            </div>
            <pre className="p-5 text-xs font-mono text-green-400 leading-relaxed overflow-x-auto whitespace-pre">
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
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Lock,
    title: 'Zero-knowledge encryption',
    description:
      'Your vault is encrypted with a key derived from your password using PBKDF2 (600k iterations). The server never sees your plaintext credentials — not even for support.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Terminal,
    title: 'Developer-native CLI',
    description:
      'The `cm` CLI lets you inject secrets into any script or CI pipeline. `cm get "DB_PASSWORD"` pipes clean output with no trailing newline — ready for shell substitution.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Globe,
    title: 'Environment labels',
    description:
      'Tag every credential with dev, staging, prod, or global. Filter by environment in the UI or `cm list --env prod`. Know exactly what runs where.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'Team vaults & RBAC',
    description:
      'Create shared vaults for your team with fine-grained roles: owner, admin, member, viewer. Credentials are re-encrypted with a shared vault key — no individual key sharing.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Clock,
    title: 'Expiry tracking',
    description:
      'Set an expiry date on API keys, certificates, and tokens. Get warned 14 days out. Run `cm expiring --days 30` in your alerting pipeline.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: Key,
    title: 'Scoped API keys',
    description:
      'Generate read-only or read-write API keys for CI/CD. Keys use SHA-256 hashing — only the prefix is stored. Revoke instantly from the web UI.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
]

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Built for the way developers actually work</h2>
          <p className="text-muted-foreground text-lg">
            Not another generic password manager — every feature is designed for dev team workflows.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
            <div key={title} className="rounded-xl border p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className={`inline-flex rounded-lg p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
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
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
          <p className="text-muted-foreground">Install once, use everywhere.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {STEPS.map(({ step, title, description, code }) => (
            <div key={step} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-muted-foreground/30 font-mono">{step}</span>
                <h3 className="font-semibold text-lg">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              <div className="rounded-lg bg-zinc-950 px-4 py-3 font-mono text-xs text-green-400 whitespace-pre leading-relaxed">
                {code}
              </div>
            </div>
          ))}
        </div>
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
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-5xl px-6 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
          <p className="text-muted-foreground">Start free. Upgrade when your team does.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-7 flex flex-col gap-6 ${
                plan.highlight ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''
              }`}
            >
              {plan.highlight && (
                <Badge className="self-start text-[10px]">Most popular</Badge>
              )}
              <div>
                <p className="font-semibold text-lg">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button variant={plan.variant} className="w-full">{plan.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
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
    q: 'Can I self-host Vault?',
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
    <section id="faq" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-2xl px-6 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        </div>
        <div className="space-y-2">
          {FAQS.map(({ q, a }, i) => (
            <div key={q} className="rounded-lg border bg-background overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {q}
                {open === i
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t pt-4">
                  {a}
                </div>
              )}
            </div>
          ))}
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
    <section className="py-24">
      <div className="mx-auto max-w-2xl px-6 text-center space-y-6">
        <div className="inline-flex rounded-full bg-primary/10 p-3 mb-2">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Ready to secure your secrets?</h2>
        <p className="text-muted-foreground text-lg">
          Start free today — no credit card required. Or join the waitlist for early access to new features.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              Create free account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">or join the waitlist for updates</span>
          </div>
        </div>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-sm">
            <Check className="h-4 w-4" />
            You&apos;re on the list! We&apos;ll be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="outline" disabled={loading}>
              {loading ? '…' : 'Join'}
            </Button>
          </form>
        )}
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
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Vault — Secure credentials for developers</span>
        </div>
        <div className="flex gap-5">
          <Link href="/register" className="hover:text-foreground transition-colors">Get started</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
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
      <Nav />
      <main>
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
