'use client'

import { useState } from 'react'
import { Zap, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { billingApi } from '@/lib/api'
import { toast } from 'sonner'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  /** Reason to show at the top (e.g. "Free plan limit reached") */
  reason?: string
}

const PLANS = [
  {
    name: 'Pro',
    price: '$6/mo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
    features: ['Unlimited credentials', 'Full activity log', 'API key access', 'CLI tool'],
    highlight: true,
  },
  {
    name: 'Team',
    price: '$8/user/mo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID ?? '',
    features: ['Everything in Pro', 'Up to 25 users', 'Shared vaults', 'RBAC roles'],
    highlight: false,
  },
]

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  if (!open) return null

  const handleUpgrade = async (priceId: string, planName: string) => {
    setLoading(priceId)
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
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-xl border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Upgrade your plan</h2>
            </div>
            {reason && (
              <p className="text-sm text-muted-foreground">{reason}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-2 gap-4 px-6 pb-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-5 flex flex-col gap-4 ${
                plan.highlight ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-base">{plan.name}</span>
                  <span className="text-sm text-muted-foreground">{plan.price}</span>
                </div>
              </div>
              <ul className="space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlight ? 'default' : 'outline'}
                disabled={loading !== null}
                onClick={() => handleUpgrade(plan.priceId, plan.name)}
              >
                {loading === plan.priceId ? 'Redirecting…' : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
