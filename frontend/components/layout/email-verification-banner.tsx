'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user)
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)

  if (!user || user.is_email_verified || dismissed) return null

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.resendVerification()
      toast.success('Verification email sent — check your inbox')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400">
      <span className="flex-1">
        Your email address hasn&apos;t been verified.{' '}
        <button
          onClick={handleResend}
          disabled={resending}
          className="font-medium underline underline-offset-4 hover:opacity-80 disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Resend verification email'}
        </button>
      </span>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
