'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/shared/page'
import { Field, PasswordInput, StrengthMeter, fieldAria } from '@/components/shared/form'
import { StatusPill } from '@/components/shared/badges'
import { authApi } from '@/lib/api'
import { useT } from '@/lib/i18n'

const schema = z.object({
  current_password: z.string().min(1, 'Enter the password you use to sign in now.'),
  new_password: z.string().min(8, 'Use at least 8 characters — a short phrase works well.'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'This doesn’t match the new password. Type it again.',
  path: ['confirm_password'],
})
type FormValues = z.infer<typeof schema>

export default function AccountSettingsPage() {
  const { t } = useT()
  const [done, setDone] = useState(false)
  const [resending, setResending] = useState(false)
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: authApi.me })

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })
  const newPassword = useWatch({ control, name: 'new_password' }) ?? ''

  const onSubmit = async (data: FormValues) => {
    setDone(false)
    try {
      await authApi.changePassword({ current_password: data.current_password, new_password: data.new_password })
      toast.success('Password changed', { description: 'Use your new password next time you sign in.' })
      reset()
      setDone(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change your password. Check the current password and try again.')
    }
  }

  const resend = async () => {
    setResending(true)
    try {
      await authApi.resendVerification()
      toast.success('Verification email sent', { description: `Check ${user?.email ?? 'your inbox'} for the link.` })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the email. Try again in a minute.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-5">
      <Panel
        title={t.settings.changePassword}
        description="This is the password you sign in with. It also unlocks your vault, so make it long and unique."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Lets password managers file the new password under the right account. */}
          <input type="text" name="username" autoComplete="username" value={user?.username ?? ''} readOnly hidden />
          <Field id="current_password" label="Current password" required error={errors.current_password?.message}>
            <PasswordInput
              {...fieldAria('current_password', errors.current_password?.message)}
              autoComplete="current-password"
              {...register('current_password')}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="new_password"
              label="New password"
              required
              error={errors.new_password?.message}
              hint={newPassword ? undefined : 'At least 8 characters.'}
            >
              <PasswordInput
                {...fieldAria('new_password', errors.new_password?.message, !newPassword)}
                autoComplete="new-password"
                {...register('new_password')}
              />
              <StrengthMeter password={newPassword} />
            </Field>
            <Field id="confirm_password" label="Confirm new password" required error={errors.confirm_password?.message}>
              <PasswordInput
                {...fieldAria('confirm_password', errors.confirm_password?.message)}
                autoComplete="new-password"
                {...register('confirm_password')}
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {done && <StatusPill tone="success" className="mr-auto">Password changed</StatusPill>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Changing password…' : 'Change password'}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Email address" description="Used for sign-in recovery and organization invitations.">
        <div className="flex flex-wrap items-center gap-3">
          <span className="min-w-0 break-all text-sm font-medium" translate="no">{user?.email ?? '…'}</span>
          {user && (user.is_email_verified
            ? <StatusPill tone="success">Verified</StatusPill>
            : <StatusPill tone="warning">Not verified</StatusPill>)}
          {user && !user.is_email_verified && (
            <Button variant="outline" size="sm" className="ml-auto" onClick={resend} disabled={resending}>
              {resending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {resending ? 'Sending…' : 'Resend verification email'}
            </Button>
          )}
        </div>
      </Panel>
    </div>
  )
}
