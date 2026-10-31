'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Panel } from '@/components/shared/page'
import { Field, fieldAria } from '@/components/shared/form'
import { StatusPill } from '@/components/shared/badges'
import { MetaList } from '@/components/shared/kbd'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const schema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name.'),
  last_name: z.string().trim().min(1, 'Enter your last name. One letter is fine.'),
})
type FormValues = z.infer<typeof schema>

export default function GeneralSettingsPage() {
  const setUser = useAuthStore((s) => s.setUser)
  const qc = useQueryClient()
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: authApi.me })
  const { t, lang } = useT()

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase() || user.username[0]?.toUpperCase()
    : ''

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // `values` keeps the form in step with the persisted user once it hydrates.
    values: user ? { first_name: user.first_name, last_name: user.last_name } : undefined,
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const updated = await authApi.updateProfile(data)
      setUser(updated)
      qc.setQueryData(['me'], updated)
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Name updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your name. Try again in a moment.')
    }
  }

  return (
    <div className="space-y-5">
      <Panel title="Profile" description={t.settings.profileSubtitle}>
        {user ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-accent text-xl font-semibold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{user.first_name} {user.last_name}</p>
                <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <MetaList
              className="border-t pt-4"
              items={[
                {
                  label: 'Email',
                  value: (
                    <span className="inline-flex flex-wrap items-center justify-end gap-2">
                      <span className="break-all" translate="no">{user.email}</span>
                      {user.is_email_verified
                        ? <StatusPill tone="success">Verified</StatusPill>
                        : <StatusPill tone="warning">Not verified</StatusPill>}
                    </span>
                  ),
                },
                { label: 'Member since', value: formatDate(user.created_at, lang, { month: 'long', year: 'numeric' }) },
              ]}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-24" /></div>
          </div>
        )}
      </Panel>

      <Panel title={t.settings.displayName} description="Shown to people you share vaults with.">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="first_name" label="First name" required error={errors.first_name?.message}>
              <Input
                {...fieldAria('first_name', errors.first_name?.message)}
                autoComplete="given-name"
                {...register('first_name')}
              />
            </Field>
            <Field id="last_name" label="Last name" required error={errors.last_name?.message}>
              <Input
                {...fieldAria('last_name', errors.last_name?.message)}
                autoComplete="family-name"
                {...register('last_name')}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            {isDirty && (
              <Button type="button" variant="ghost" onClick={() => reset()}>{t.common.cancel}</Button>
            )}
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Saving…' : 'Save name'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
