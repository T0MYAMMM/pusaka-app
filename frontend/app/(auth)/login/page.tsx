'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, MailWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, PasswordInput, fieldAria } from '@/components/shared/form'
import { AuthError, AuthFooter, AuthHeader, AuthLink, AuthSubmit } from '@/components/features/auth-ui'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const schema = z.object({
  username: z.string().min(1, 'Enter your username.'),
  password: z.string().min(1, 'Enter your password.'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [unverified, setUnverified] = useState(false)
  const [resending, setResending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setUnverified(false)
    setFormError(null)
    try {
      const user = await authApi.login(data)
      setUser(user)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof Error && err.message.includes('not verified')) {
        setUnverified(true)
      } else {
        setFormError(err instanceof Error ? err.message : 'Sign-in failed. Try again in a moment.')
      }
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.resendVerification()
      toast.success('Verification email sent. Check your inbox.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend the email. Try again in a moment.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-8">
      <AuthHeader title="Welcome back" description="Sign in to open your vault." />

      {unverified && (
        <div role="alert" className="flex gap-3 rounded-lg bg-warning-soft p-4 text-sm text-warning">
          <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="font-semibold">Verify your email to sign in</p>
            <p className="text-pretty">Open the link we emailed you, then sign in again. Can’t find it? Check spam, or send a new one.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={resending}
              className="mt-2 border-warning/40 bg-transparent text-warning hover:bg-warning/10 hover:text-warning dark:bg-transparent"
            >
              {resending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {resending ? 'Sending…' : 'Resend verification email'}
            </Button>
          </div>
        </div>
      )}

      {formError && (
        <AuthError>
          <p className="font-semibold">{formError}</p>
          <p>Usernames and passwords are case-sensitive. Check for typos, or <AuthLink href="/forgot-password">reset your password</AuthLink>.</p>
        </AuthError>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field id="username" label="Username" error={errors.username?.message}>
          <Input
            {...fieldAria('username', errors.username?.message)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            {...register('username')}
          />
        </Field>

        <Field
          id="password"
          label="Password"
          error={errors.password?.message}
          labelAction={
            <Link
              href="/forgot-password"
              className="inline-flex min-h-6 items-center rounded-sm text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            {...fieldAria('password', errors.password?.message)}
            autoComplete="current-password"
            {...register('password')}
          />
        </Field>

        <div className="pt-1">
          <AuthSubmit pending={isSubmitting} pendingLabel="Signing in…">Sign in</AuthSubmit>
        </div>
      </form>

      <AuthFooter>
        New to Pusaka? <AuthLink href="/register">Create an account</AuthLink>
      </AuthFooter>
    </div>
  )
}
