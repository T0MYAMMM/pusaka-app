'use client'

import Link from 'next/link'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Panel } from '@/components/shared/page'
import { Field, FormActions, PasswordInput, StrengthMeter, fieldAria, useUnsavedChangesWarning } from '@/components/shared/form'
import { CREDENTIAL_TYPES } from '@/lib/item-meta'
import { generatePassword } from '@/lib/password'
import type { CredentialDetail } from '@/lib/api'

const ENVS = [
  { value: 'global', label: 'Global — used everywhere' },
  { value: 'prod', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'dev', label: 'Development' },
]

const schema = z.object({
  label: z.string().trim().min(1, 'Give it a name you will recognise, e.g. “BCA KlikPay”.'),
  type: z.string().min(1),
  website_url: z.string().url('Enter a full address starting with https://').or(z.literal('')).optional(),
  username: z.string().optional(),
  email: z.string().email('Enter an email like name@example.com').or(z.literal('')).optional(),
  password: z.string().optional(),
  secret_key: z.string().optional(),
  note: z.string().optional(),
  tags: z.string().optional(),
  env: z.string().optional(),
  expires_at: z.string().optional(),
})

type FormFields = z.infer<typeof schema>

/** What the API receives: expiry as ISO timestamp or null. */
export type CredentialFormValues = Omit<FormFields, 'expires_at'> & { expires_at: string | null }

interface Props {
  defaultValues?: Partial<CredentialDetail>
  onSubmit: (data: CredentialFormValues) => Promise<void>
  isSubmitting?: boolean
  submitLabel: string
  cancelHref: string
}

export function CredentialForm({ defaultValues, onSubmit, isSubmitting, submitLabel, cancelHref }: Props) {
  const { register, handleSubmit, setValue, control, formState: { errors, isDirty } } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: defaultValues?.label ?? '',
      type: defaultValues?.type ?? 'website',
      website_url: defaultValues?.website_url ?? '',
      username: defaultValues?.username ?? '',
      email: defaultValues?.email ?? '',
      password: defaultValues?.password ?? '',
      secret_key: defaultValues?.secret_key ?? '',
      note: defaultValues?.note ?? '',
      tags: defaultValues?.tags ?? '',
      env: defaultValues?.env ?? 'global',
      expires_at: defaultValues?.expires_at ? defaultValues.expires_at.slice(0, 10) : '',
    },
  })

  useUnsavedChangesWarning(isDirty && !isSubmitting)

  const type = useWatch({ control, name: 'type' })
  const env = useWatch({ control, name: 'env' })
  const password = useWatch({ control, name: 'password' }) ?? ''

  const submit = handleSubmit(async ({ expires_at, ...rest }) => {
    await onSubmit({ ...rest, expires_at: expires_at ? new Date(expires_at).toISOString() : null })
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Panel title="What is it?" description="A name and category help you find it later.">
        <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
          <Field id="label" label="Name" required error={errors.label?.message}>
            <Input {...fieldAria('label', errors.label?.message)} placeholder="e.g. BCA KlikPay…" autoComplete="off" {...register('label')} />
          </Field>
          <Field id="type" label="Category">
            <Select value={type} onValueChange={(v) => setValue('type', v, { shouldDirty: true })}>
              <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CREDENTIAL_TYPES).map(([value, { label, icon: Icon }]) => (
                  <SelectItem key={value} value={value}>
                    <Icon aria-hidden="true" />
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field id="website_url" label="Website" className="mt-5" error={errors.website_url?.message}>
          <Input
            {...fieldAria('website_url', errors.website_url?.message)}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://example.com…"
            {...register('website_url')}
          />
        </Field>
      </Panel>

      <Panel title="Sign-in details" description="Encrypted with your vault key before it is stored.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="username" label="Username">
            <Input id="username" autoComplete="off" spellCheck={false} {...register('username')} />
          </Field>
          <Field id="email" label="Email" error={errors.email?.message}>
            <Input
              {...fieldAria('email', errors.email?.message)}
              type="email"
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              {...register('email')}
            />
          </Field>
          <Field id="password" label="Password" className="sm:col-span-2">
            <PasswordInput
              id="password"
              autoComplete="new-password"
              {...register('password')}
              trailing={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setValue('password', generatePassword(20), { shouldDirty: true })}
                      aria-label="Generate a strong password"
                      className="inline-flex size-8 items-center justify-center rounded-md text-brass-foreground transition-colors hover:bg-brass-soft"
                    >
                      <WandSparkles className="size-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Generate a strong password</TooltipContent>
                </Tooltip>
              }
            />
            <StrengthMeter password={password} />
          </Field>
          <Field id="secret_key" label="Secret key or 2FA seed" className="sm:col-span-2" hint="Recovery codes, TOTP seeds or API secrets.">
            <PasswordInput id="secret_key" autoComplete="off" aria-describedby="secret_key-hint" {...register('secret_key')} />
          </Field>
        </div>
      </Panel>

      <Panel title="Organise" description="Optional — environment, expiry, tags and notes.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="env" label="Environment">
            <Select value={env} onValueChange={(v) => setValue('env', v, { shouldDirty: true })}>
              <SelectTrigger id="env" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENVS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field id="expires_at" label="Expires on" hint="You will be reminded 14 days before.">
            <Input id="expires_at" type="date" aria-describedby="expires_at-hint" {...register('expires_at')} />
          </Field>
          <Field id="tags" label="Tags" className="sm:col-span-2" hint="Separate with commas.">
            <Input id="tags" autoComplete="off" placeholder="family, bank…" aria-describedby="tags-hint" {...register('tags')} />
          </Field>
          <Field id="note" label="Notes" className="sm:col-span-2">
            <Textarea id="note" rows={3} placeholder="Security questions, account numbers, anything else…" {...register('note')} />
          </Field>
        </div>
      </Panel>

      <FormActions>
        <Button variant="ghost" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </FormActions>
    </form>
  )
}
