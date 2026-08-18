'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { authApi } from '@/lib/api'

type Status = 'loading' | 'success' | 'error'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the link.')
      return
    }
    authApi.verifyEmail(token)
      .then((res) => {
        setMessage(res.detail)
        setStatus('success')
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : 'Verification failed.')
        setStatus('error')
      })
  }, [token])

  if (status === 'loading') {
    return <p className="text-sm text-muted-foreground">Verifying your email…</p>
  }

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        {status === 'success' ? 'Email verified' : 'Verification failed'}
      </h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      {status === 'success' ? (
        <Link href="/dashboard" className="text-sm font-medium underline underline-offset-4 hover:text-foreground">
          Go to your vault
        </Link>
      ) : (
        <Link href="/login" className="text-sm font-medium underline underline-offset-4 hover:text-foreground">
          Back to login
        </Link>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Verifying…</p>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
