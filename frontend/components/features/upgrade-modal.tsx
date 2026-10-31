'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LogoMark } from '@/components/brand/logo'
import { billingApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  /** Reason to show at the top (e.g. "Free plan limit reached") */
  reason?: string
}

const PLANS = [
  {
    name: 'Pro',
    price: '$6',
    period: 'per month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
    features: ['Unlimited credentials', 'Full activity log', 'API key access', 'CLI tool'],
    highlight: true,
  },
  {
    name: 'Team',
    price: '$8',
    period: 'per user / month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID ?? '',
    features: ['Everything in Pro', 'Up to 25 users', 'Shared vaults', 'Roles and permissions'],
    highlight: false,
  },
]

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (priceId: string) => {
    setLoading(priceId)
    try {
      const origin = window.location.origin
      const { url } = await billingApi.checkout({
        price_id: priceId,
        success_url: `${origin}/settings/billing?success=1`,
        cancel_url: `${origin}/settings/billing`,
      })
      window.location.assign(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout could not start. Try again in a moment.')
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="items-start text-left">
          <LogoMark className="mb-2 size-10" />
          <DialogTitle className="text-xl">Keep more in your vault</DialogTitle>
          <DialogDescription>{reason ?? 'Upgrade for unlimited storage and team sharing.'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col gap-4 rounded-xl border p-5',
                plan.highlight && 'border-primary/40 bg-accent/60',
              )}
            >
              <div>
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight tabular">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </p>
              </div>
              <ul className="flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlight ? 'default' : 'outline'}
                disabled={loading !== null}
                onClick={() => handleUpgrade(plan.priceId)}
              >
                {loading === plan.priceId && <Loader2 className="animate-spin" aria-hidden="true" />}
                {loading === plan.priceId ? 'Opening checkout…' : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
