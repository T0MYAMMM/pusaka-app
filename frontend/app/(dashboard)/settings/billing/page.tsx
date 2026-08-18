'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Zap, Users, Shield, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { authApi, billingApi } from '@/lib/api'
import { toast } from 'sonner'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  team_growth: 'Team Growth',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'secondary',
  pro: 'default',
  team: 'default',
  team_growth: 'default',
}

function BillingContent() {
  const sp = useSearchParams()
  const justUpgraded = sp.get('success') === '1'
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
  })

  const plan = user?.plan ?? 'free'

  const handleManage = async () => {
    setPortalLoading(true)
    try {
      const { url } = await billingApi.portal({ return_url: window.location.href })
      window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal')
      setPortalLoading(false)
    }
  }

  const handleUpgrade = async (priceId: string) => {
    setCheckoutLoading(priceId)
    try {
      const origin = window.location.origin
      const { url } = await billingApi.checkout({
        price_id: priceId,
        success_url: `${origin}/settings/billing?success=1`,
        cancel_url: `${origin}/settings/billing`,
      })
      window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout')
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and plan.</p>
      </div>

      {justUpgraded && (
        <div className="flex items-center gap-3 rounded-md border border-green-500/30 bg-green-500/10 p-4">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="font-medium text-sm text-green-700 dark:text-green-400">Subscription activated!</p>
            <p className="text-xs text-muted-foreground">Your plan has been upgraded. Thank you!</p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <section className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold">{PLAN_LABELS[plan] ?? plan}</span>
              <Badge variant={PLAN_COLORS[plan] as 'default' | 'secondary' ?? 'secondary'}>
                {plan === 'free' ? 'Free forever' : 'Active'}
              </Badge>
            </div>
          </div>
          {plan !== 'free' && (
            <Button variant="outline" onClick={handleManage} disabled={portalLoading}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {portalLoading ? 'Opening…' : 'Manage subscription'}
            </Button>
          )}
        </div>

        {plan === 'free' && (
          <p className="text-sm text-muted-foreground">
            Free plan: up to 100 credentials, 1 user, 30-day activity log.
          </p>
        )}
        {plan === 'pro' && (
          <p className="text-sm text-muted-foreground">
            Pro plan: unlimited credentials, full activity log, API key access.
          </p>
        )}
        {(plan === 'team' || plan === 'team_growth') && (
          <p className="text-sm text-muted-foreground">
            Team plan: shared vaults, RBAC, up to {plan === 'team' ? '25' : '100'} members.
          </p>
        )}
      </section>

      <Separator />

      {/* Upgrade options (only shown if not on highest tier) */}
      {plan === 'free' && (
        <section className="space-y-4">
          <h2 className="font-semibold">Upgrade your plan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <PlanCard
              icon={<Zap className="h-5 w-5 text-amber-500" />}
              name="Pro"
              price="$6/mo"
              features={['Unlimited credentials', 'Full activity log', 'API key access', 'CLI tool']}
              priceId={process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? ''}
              highlight
              loading={checkoutLoading}
              onUpgrade={handleUpgrade}
            />
            <PlanCard
              icon={<Users className="h-5 w-5 text-blue-500" />}
              name="Team"
              price="$8/user/mo"
              features={['Everything in Pro', 'Up to 25 users', 'Shared vaults', 'RBAC roles']}
              priceId={process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID ?? ''}
              loading={checkoutLoading}
              onUpgrade={handleUpgrade}
            />
          </div>
        </section>
      )}

      {plan === 'pro' && (
        <section className="space-y-4">
          <h2 className="font-semibold">Add team features</h2>
          <PlanCard
            icon={<Users className="h-5 w-5 text-blue-500" />}
            name="Team"
            price="$8/user/mo"
            features={['Shared vaults', 'Up to 25 members', 'RBAC roles', 'Audit trail']}
            priceId={process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID ?? ''}
            loading={checkoutLoading}
            onUpgrade={handleUpgrade}
          />
        </section>
      )}

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Payments are processed securely by Stripe. We never store your card details.
          Cancel any time — your data is always yours.
        </p>
      </div>
    </div>
  )
}

function PlanCard({
  icon, name, price, features, priceId, highlight, loading, onUpgrade,
}: {
  icon: React.ReactNode
  name: string
  price: string
  features: string[]
  priceId: string
  highlight?: boolean
  loading: string | null
  onUpgrade: (priceId: string) => void
}) {
  return (
    <div className={`rounded-lg border p-5 flex flex-col gap-4 ${highlight ? 'border-primary bg-primary/5' : ''}`}>
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{price}</p>
        </div>
      </div>
      <ul className="space-y-1.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        variant={highlight ? 'default' : 'outline'}
        className="w-full"
        disabled={loading !== null}
        onClick={() => onUpgrade(priceId)}
      >
        {loading === priceId ? 'Redirecting…' : `Upgrade to ${name}`}
      </Button>
    </div>
  )
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>
}
