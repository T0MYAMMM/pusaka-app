'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ExternalLink, Loader2, ShieldCheck, Users, Zap, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Panel } from '@/components/shared/page'
import { ItemTile } from '@/components/shared/item-tile'
import { StatusPill } from '@/components/shared/badges'
import { authApi, billingApi } from '@/lib/api'
import type { Tone } from '@/lib/item-meta'
import { cn } from '@/lib/utils'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  team_growth: 'Team Growth',
}

const PLAN_SUMMARY: Record<string, string> = {
  free: 'Up to 100 credentials, one user and a 30-day activity log.',
  pro: 'Unlimited credentials, the full activity log and API key access.',
  team: 'Shared vaults, roles and up to 25 members.',
  team_growth: 'Shared vaults, roles and up to 100 members.',
}

const PRO_PRICE = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? ''
const TEAM_PRICE = process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID ?? ''

interface PlanOffer {
  name: string
  price: string
  unit: string
  icon: LucideIcon
  tone: Tone
  features: string[]
  priceId: string
  highlight?: boolean
}

function BillingContent() {
  const sp = useSearchParams()
  const justUpgraded = sp.get('success') === '1'
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
  })

  const plan = user?.plan ?? 'free'

  const handleManage = async () => {
    setPortalLoading(true)
    try {
      const { url } = await billingApi.portal({ return_url: window.location.href })
      window.location.assign(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open the billing portal. Try again in a moment.')
      setPortalLoading(false)
    }
  }

  const handleUpgrade = async ({ name, priceId }: PlanOffer) => {
    setCheckoutLoading(name)
    try {
      const origin = window.location.origin
      const { url } = await billingApi.checkout({
        price_id: priceId,
        success_url: `${origin}/settings/billing?success=1`,
        cancel_url: `${origin}/settings/billing`,
      })
      window.location.assign(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout. Try again in a moment.')
      setCheckoutLoading(null)
    }
  }

  const offers: PlanOffer[] =
    plan === 'free'
      ? [
          {
            name: 'Pro', price: '$6', unit: 'per month', icon: Zap, tone: 'indigo', priceId: PRO_PRICE, highlight: true,
            features: ['Unlimited credentials', 'Full activity log', 'API keys and the CLI'],
          },
          {
            name: 'Team', price: '$8', unit: 'per user, per month', icon: Users, tone: 'sky', priceId: TEAM_PRICE,
            features: ['Everything in Pro', 'Up to 25 members', 'Shared vaults and roles'],
          },
        ]
      : plan === 'pro'
        ? [
            {
              name: 'Team', price: '$8', unit: 'per user, per month', icon: Users, tone: 'sky', priceId: TEAM_PRICE, highlight: true,
              features: ['Shared vaults', 'Up to 25 members', 'Roles for admins, members and viewers', 'Audit trail'],
            },
          ]
        : []

  return (
    <div className="space-y-5">
      <Panel
        title="Current plan"
        action={
          plan !== 'free' && (
            <Button variant="outline" size="sm" onClick={handleManage} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ExternalLink aria-hidden="true" />}
              {portalLoading ? 'Opening…' : 'Manage subscription'}
            </Button>
          )
        }
      >
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-72" /></div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-2xl font-bold tracking-[-0.02em]">{PLAN_LABELS[plan] ?? plan}</p>
              {plan === 'free'
                ? <StatusPill tone="neutral">Free forever</StatusPill>
                : <StatusPill tone="success">Active</StatusPill>}
              {justUpgraded && <StatusPill tone="success">Upgrade complete — thank you</StatusPill>}
            </div>
            <p className="text-sm text-muted-foreground">{PLAN_SUMMARY[plan] ?? 'Manage your subscription in the billing portal.'}</p>
          </div>
        )}
      </Panel>

      {offers.length > 0 && (
        <Panel
          title={plan === 'free' ? 'Upgrade your plan' : 'Add team features'}
          description="Change or cancel any time from the billing portal."
        >
          <div className={cn('grid gap-4', offers.length > 1 && 'sm:grid-cols-2')}>
            {offers.map((o) => (
              <PlanCard key={o.name} offer={o} loading={checkoutLoading} onUpgrade={handleUpgrade} />
            ))}
          </div>
        </Panel>
      )}

      <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden="true" />
        Payments are processed by Stripe — Pusaka never sees or stores your card details. Your data stays yours if you cancel.
      </p>
    </div>
  )
}

function PlanCard({
  offer, loading, onUpgrade,
}: {
  offer: PlanOffer
  loading: string | null
  onUpgrade: (offer: PlanOffer) => void
}) {
  const busy = loading === offer.name
  return (
    <div className={cn('flex flex-col gap-4 rounded-xl border p-5', offer.highlight && 'border-primary/40 bg-accent/60')}>
      <div className="flex items-center gap-3">
        <ItemTile icon={offer.icon} tone={offer.tone} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{offer.name}</p>
          <p className="text-sm text-muted-foreground">
            <span className="text-base font-bold text-foreground tabular">{offer.price}</span> {offer.unit}
          </p>
        </div>
        {offer.highlight && <StatusPill tone="info">Recommended</StatusPill>}
      </div>
      <ul className="flex-1 space-y-2">
        {offer.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        variant={offer.highlight ? 'default' : 'outline'}
        className="w-full"
        disabled={loading !== null}
        onClick={() => onUpgrade(offer)}
      >
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {busy ? 'Opening checkout…' : `Upgrade to ${offer.name}`}
      </Button>
    </div>
  )
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>
}
