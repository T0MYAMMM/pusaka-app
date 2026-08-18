'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { authApi } from '@/lib/api'

const schema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
type FormValues = z.infer<typeof schema>

export default function AccountSettingsPage() {
  const [done, setDone] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.changePassword({ current_password: data.current_password, new_password: data.new_password })
      toast.success('Password changed successfully')
      reset()
      setDone(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">Manage your password and account credentials</p>
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Change password</h2>

        {done && (
          <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            Password changed successfully. Use your new password next time you log in.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input type="password" autoComplete="current-password" {...register('current_password')} />
            {errors.current_password && <p className="text-xs text-destructive">{errors.current_password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type="password" autoComplete="new-password" {...register('new_password')} />
            {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <Input type="password" autoComplete="new-password" {...register('confirm_password')} />
            {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Update password'}
          </Button>
        </form>
      </section>
    </div>
  )
}
