'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { MailCheck, MailX } from 'lucide-react'
import { AuthLoading, AuthResult } from '@/components/features/auth-ui'
import { authApi } from '@/lib/api'

type Status = 'loading' | 'success' | 'error'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [result, setResult] = useState<{ status: Status; message: string } | null>(null)

  useEffect(() => {
    if (!token) return
    authApi.verifyEmail(token)
      .then((res) => setResult({ status: 'success', message: res.detail }))
      .catch((err) => setResult({ status: 'error', message: err instanceof Error ? err.message : 'Verification failed.' }))
  }, [token])

  // A link without a token fails immediately; otherwise wait for the API.
  const status: Status = !token ? 'error' : result?.status ?? 'loading'
  const message = !token ? 'No verification token found in the link.' : result?.message ?? ''

  if (status === 'loading') {
    return <AuthLoading>Verifying your email…</AuthLoading>
  }

  if (status === 'success') {
    return (
      <AuthResult
        tone="success"
        icon={MailCheck}
        title="Email verified"
        action={{ href: '/dashboard', label: 'Go to your vault' }}
      >
        <p>{message}</p>
      </AuthResult>
    )
  }

  return (
    <AuthResult
      tone="error"
      icon={MailX}
      title="We couldn’t verify your email"
      action={{ href: '/login', label: 'Back to sign in' }}
    >
      <p>{message}</p>
      <p className="mt-2">Open the newest link we sent, or sign in to get a fresh one.</p>
    </AuthResult>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthLoading>Verifying…</AuthLoading>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
