'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Link2Off } from 'lucide-react'
import { Field, PasswordInput, StrengthMeter, fieldAria } from '@/components/shared/form'
import { AuthError, AuthFooter, AuthHeader, AuthLink, AuthLoading, AuthResult, AuthSubmit } from '@/components/features/auth-ui'
import { authApi } from '@/lib/api'

const schema = z.object({
  new_password: z.string().min(8, 'Use at least 8 characters.'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords don’t match. Retype the new password.',
  path: ['confirm_password'],
})
type FormValues = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  const password = useWatch({ control, name: 'new_password' }) ?? ''

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    try {
      await authApi.resetPassword({ token, new_password: data.new_password })
      toast.success('Password updated. Sign in with your new password.')
      router.push('/login')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.')
    }
  }

  if (!token) {
    return (
      <AuthResult
        tone="error"
        icon={Link2Off}
        title="This reset link doesn’t work"
        action={{ href: '/forgot-password', label: 'Request a new link' }}
      >
        <p>The link is missing its token, or it was only partly copied. Request a new one and open it straight from the email.</p>
      </AuthResult>
    )
  }

  return (
    <div className="space-y-8">
      <AuthHeader title="Choose a new password" description="You’ll use it to sign in and to unlock your vault." />

      {formError && (
        <AuthError>
          <p>{formError}</p>
          <p>
            Links expire after a while. <AuthLink href="/forgot-password">Request a new link</AuthLink>
          </p>
        </AuthError>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field id="new_password" label="New password" error={errors.new_password?.message} hint="At least 8 characters.">
          <PasswordInput
            {...fieldAria('new_password', errors.new_password?.message, true)}
            autoComplete="new-password"
            {...register('new_password')}
          />
          <StrengthMeter password={password} />
        </Field>

        <Field id="confirm_password" label="Confirm new password" error={errors.confirm_password?.message}>
          <PasswordInput
            {...fieldAria('confirm_password', errors.confirm_password?.message)}
            autoComplete="new-password"
            {...register('confirm_password')}
          />
        </Field>

        <div className="pt-1">
          <AuthSubmit pending={isSubmitting} pendingLabel="Saving…">Set new password</AuthSubmit>
        </div>
      </form>

      <AuthFooter>
        Remembered it? <AuthLink href="/login">Sign in</AuthLink>
      </AuthFooter>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoading>Loading…</AuthLoading>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
