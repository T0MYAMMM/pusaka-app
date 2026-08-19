'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [unverified, setUnverified] = useState(false)
  const [resending, setResending] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setUnverified(false)
    try {
      const user = await authApi.login(data)
      setUser(user)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof Error && err.message.includes('not verified')) {
        setUnverified(true)
      } else {
        toast.error(err instanceof Error ? err.message : 'Login failed')
      }
    }
  }

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
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="font-serif text-lg font-bold tracking-wide text-primary">Pusaka</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials to access your vault</p>
      </div>

      {unverified && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
          <p className="font-medium">Email not verified</p>
          <p className="mt-1">Check your inbox for the verification link.</p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="mt-2 underline underline-offset-4 hover:opacity-80 disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="username" {...register('username')} />
          {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="inline-flex min-h-6 items-center rounded-sm text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="font-medium underline underline-offset-4 hover:text-foreground">
          Create one
        </Link>
      </p>
    </div>
  )
}
