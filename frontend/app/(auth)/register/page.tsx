'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Field, PasswordInput, StrengthMeter, fieldAria } from '@/components/shared/form'
import { AuthError, AuthFooter, AuthHeader, AuthLink, AuthSubmit } from '@/components/features/auth-ui'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const schema = z.object({
  first_name: z.string().min(1, 'Enter your first name.'),
  last_name: z.string().min(1, 'Enter your last name.'),
  username: z.string().min(2, 'Use at least 2 characters.').regex(/^[\w-]+$/, 'Use only letters, numbers, hyphens and underscores.'),
  email: z.string().email('Enter an email like name@example.com.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords don’t match. Retype the password above.', path: ['confirm'] })
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  const password = useWatch({ control, name: 'password' }) ?? ''

  const onSubmit = async ({ first_name, last_name, username, email, password }: FormValues) => {
    setFormError(null)
    try {
      const user = await authApi.register({ first_name, last_name, username, email, password })
      setUser(user)
      router.push('/dashboard')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create your account. Try again in a moment.')
    }
  }

  return (
    <div className="space-y-8">
      <AuthHeader
        title="Create your account"
        description="One vault for your passwords, notes and documents."
      />

      {formError && <AuthError><p>{formError}</p></AuthError>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field id="first_name" label="First name" error={errors.first_name?.message}>
            <Input {...fieldAria('first_name', errors.first_name?.message)} autoComplete="given-name" {...register('first_name')} />
          </Field>
          <Field id="last_name" label="Last name" error={errors.last_name?.message}>
            <Input {...fieldAria('last_name', errors.last_name?.message)} autoComplete="family-name" {...register('last_name')} />
          </Field>
        </div>

        <Field id="username" label="Username" error={errors.username?.message} hint="Letters, numbers, hyphens and underscores.">
          <Input
            {...fieldAria('username', errors.username?.message, true)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            {...register('username')}
          />
        </Field>

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

        <Field id="password" label="Password" error={errors.password?.message} hint="At least 8 characters. A short sentence is easy to remember.">
          <PasswordInput
            {...fieldAria('password', errors.password?.message, true)}
            autoComplete="new-password"
            {...register('password')}
          />
          <StrengthMeter password={password} />
        </Field>

        <Field id="confirm" label="Confirm password" error={errors.confirm?.message}>
          <PasswordInput
            {...fieldAria('confirm', errors.confirm?.message)}
            autoComplete="new-password"
            {...register('confirm')}
          />
        </Field>

        <div className="pt-1">
          <AuthSubmit pending={isSubmitting} pendingLabel="Creating account…">Create account</AuthSubmit>
        </div>
      </form>

      <AuthFooter>
        Already have an account? <AuthLink href="/login">Sign in</AuthLink>
      </AuthFooter>
    </div>
  )
}
