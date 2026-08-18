'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
})
type FormValues = z.infer<typeof schema>

export default function GeneralSettingsPage() {
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : '?'

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: user?.first_name ?? '', last_name: user?.last_name ?? '' },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const updated = await authApi.updateProfile(data)
      setUser(updated)
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated')
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">General</h1>
        <p className="text-sm text-muted-foreground">Your public profile information</p>
      </div>

      <Separator />

      {/* Avatar + identity */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.first_name} {user?.last_name}</p>
            <p className="text-sm text-muted-foreground">@{user?.username}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {user?.created_at && (
          <p className="text-xs text-muted-foreground">
            Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
        )}
      </section>

      <Separator />

      {/* Edit name */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Display name</h2>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input {...register('first_name')} />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input {...register('last_name')} />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { reset(); setEditing(false) }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {user?.first_name} {user?.last_name}
          </p>
        )}
      </section>
    </div>
  )
}
