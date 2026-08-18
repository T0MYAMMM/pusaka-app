'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CredentialDetail } from '@/lib/api'

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-yellow-500' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

const TYPES = ['website','email','social','banking','work','personal','server','api','other'] as const

const schema = z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.string().min(1),
  website_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  username: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  password: z.string().optional(),
  secret_key: z.string().optional(),
  note: z.string().optional(),
  tags: z.string().optional(),
})

export type CredentialFormValues = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<CredentialDetail>
  onSubmit: (data: CredentialFormValues) => Promise<void>
  isSubmitting?: boolean
  submitLabel: string
}

export function CredentialForm({ defaultValues, onSubmit, isSubmitting, submitLabel }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CredentialFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: defaultValues?.label ?? '',
      type: defaultValues?.type ?? 'other',
      website_url: defaultValues?.website_url ?? '',
      username: defaultValues?.username ?? '',
      email: defaultValues?.email ?? '',
      password: defaultValues?.password ?? '',
      secret_key: defaultValues?.secret_key ?? '',
      note: defaultValues?.note ?? '',
      tags: defaultValues?.tags ?? '',
    },
  })

  const type = watch('type')
  const password = watch('password') ?? ''
  const strength = passwordStrength(password)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="label">Label *</Label>
          <Input id="label" placeholder="e.g. GitHub Work Account" {...register('label')} />
          {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <Input id="website_url" placeholder="https://example.com" {...register('website_url')} />
        {errors.website_url && <p className="text-xs text-destructive">{errors.website_url.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="off" {...register('username')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="off" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= Math.ceil(strength.score / 1.25) ? strength.color : 'bg-muted'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strength.label}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="secret_key">Secret Key / 2FA</Label>
          <Input id="secret_key" autoComplete="off" {...register('secret_key')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" placeholder="work, personal, dev (comma-separated)" {...register('tags')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Notes</Label>
        <Textarea id="note" rows={3} placeholder="Additional notes…" {...register('note')} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
