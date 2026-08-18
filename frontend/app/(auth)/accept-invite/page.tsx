'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { authApi, orgsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

type Status = 'loading' | 'needs_login' | 'success' | 'error'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No invite token found.')
      return
    }

    if (!user) {
      // Not logged in — redirect to register with token preserved
      router.push(`/register?invite=${encodeURIComponent(token)}`)
      return
    }

    orgsApi.acceptInvite(token)
      .then(() => {
        setStatus('success')
        setMessage('You have joined the organization.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Failed to accept invite.')
      })
  }, [token, user, router])

  if (status === 'loading') {
    return <p className="text-sm text-muted-foreground">Processing invite…</p>
  }

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        {status === 'success' ? 'Invite accepted!' : 'Invite error'}
      </h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      {status === 'success' ? (
        <Link href="/vaults" className="text-sm font-medium underline underline-offset-4 hover:text-foreground">
          Go to shared vaults
        </Link>
      ) : (
        <Link href="/login" className="text-sm font-medium underline underline-offset-4 hover:text-foreground">
          Back to login
        </Link>
      )}
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AcceptInviteContent />
    </Suspense>
  )
}
