'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'

const schema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})
type FormValues = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.resetPassword({ token, new_password: data.new_password })
      toast.success('Password reset successfully')
      router.push('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed. The link may have expired.')
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Invalid link</h1>
        <p className="text-sm text-muted-foreground">This reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="text-sm font-medium underline underline-offset-4 hover:text-foreground">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new_password">New password</Label>
          <Input id="new_password" type="password" autoComplete="new-password" {...register('new_password')} />
          {errors.new_password && <p className="text-sm text-destructive">{errors.new_password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input id="confirm_password" type="password" autoComplete="new-password" {...register('confirm_password')} />
          {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
