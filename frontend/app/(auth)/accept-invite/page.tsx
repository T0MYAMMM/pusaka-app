'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { UserCheck, UserX } from 'lucide-react'
import { AuthLoading, AuthResult } from '@/components/features/auth-ui'
import { orgsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

type Status = 'loading' | 'success' | 'error'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const user = useAuthStore((s) => s.user)
  const [result, setResult] = useState<{ status: Status; message: string } | null>(null)

  useEffect(() => {
    if (!token) return

    if (!user) {
      // Not logged in — redirect to register with token preserved
      router.push(`/register?invite=${encodeURIComponent(token)}`)
      return
    }

    orgsApi.acceptInvite(token)
      .then(() => setResult({ status: 'success', message: 'You have joined the organization.' }))
      .catch((err) => setResult({ status: 'error', message: err instanceof Error ? err.message : 'Failed to accept invite.' }))
  }, [token, user, router])

  // A link without a token fails immediately; otherwise wait for the API (or the redirect).
  const status: Status = !token ? 'error' : result?.status ?? 'loading'
  const message = !token ? 'No invite token found.' : result?.message ?? ''

  if (status === 'loading') {
    return <AuthLoading>Opening your invite…</AuthLoading>
  }

  if (status === 'success') {
    return (
      <AuthResult
        tone="success"
        icon={UserCheck}
        title="Invite accepted"
        action={{ href: '/vaults', label: 'Go to shared vaults' }}
      >
        <p>{message}</p>
      </AuthResult>
    )
  }

  return (
    <AuthResult
      tone="error"
      icon={UserX}
      title="This invite can’t be used"
      action={{ href: '/login', label: 'Back to sign in' }}
    >
      <p>{message}</p>
      <p className="mt-2">Ask whoever invited you to send a new invite, then open the link from that email.</p>
    </AuthResult>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AuthLoading>Loading…</AuthLoading>}>
      <AcceptInviteContent />
    </Suspense>
  )
}
