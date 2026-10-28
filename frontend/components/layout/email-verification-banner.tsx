'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MailWarning, X } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useT } from '@/lib/i18n'

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user)
  const { t } = useT()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)

  if (!user || user.is_email_verified || dismissed) return null

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.resendVerification()
      toast.success('Verification email sent', { description: `Check ${user.email}.` })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend the email. Try again in a minute.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div role="status" className="flex items-center gap-3 border-b border-warning/20 bg-warning-soft px-4 py-2 text-sm text-warning sm:px-6 lg:px-8">
      <MailWarning className="size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">
        {t.shell.unverified}{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-semibold underline underline-offset-4 hover:no-underline disabled:opacity-60"
        >
          {resending ? t.shell.sending : t.shell.resend}
        </button>
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t.shell.dismiss}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-warning/10"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
