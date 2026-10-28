'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Field, fieldAria } from '@/components/shared/form'
import { AuthError, AuthFooter, AuthHeader, AuthLink, AuthResult, AuthSubmit } from '@/components/features/auth-ui'
import { authApi } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Enter an email like name@example.com.'),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    try {
      await authApi.forgotPassword(data.email)
      setSentTo(data.email)
      setSubmitted(true)
    } catch {
      setFormError('We couldn’t send the link just now. Check your connection and try again.')
    }
  }

  if (submitted) {
    return (
      <AuthResult
        tone="success"
        icon={MailCheck}
        title="Check your inbox"
        action={{ href: '/login', label: 'Back to sign in' }}
        secondary={
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        }
      >
        <p>
          If an account uses <span className="font-semibold break-all text-foreground">{sentTo}</span>, a
          reset link is on its way. It can take a minute; check spam if it doesn’t arrive.
        </p>
      </AuthResult>
    )
  }

  return (
    <div className="space-y-8">
      <AuthHeader
        title="Reset your password"
        description="Enter the email on your account and we’ll send you a link to choose a new password."
      />

      {formError && <AuthError><p>{formError}</p></AuthError>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input
            {...fieldAria('email', errors.email?.message)}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            {...register('email')}
          />
        </Field>

        <div className="pt-1">
          <AuthSubmit pending={isSubmitting} pendingLabel="Sending…">Send reset link</AuthSubmit>
        </div>
      </form>

      <AuthFooter>
        Remembered it? <AuthLink href="/login">Sign in</AuthLink>
      </AuthFooter>
    </div>
  )
}
