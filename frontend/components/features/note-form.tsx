'use client'

import Link from 'next/link'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Panel } from '@/components/shared/page'
import { Field, FormActions, fieldAria, useUnsavedChangesWarning } from '@/components/shared/form'
import { NOTE_TYPES } from '@/lib/item-meta'
import { cn } from '@/lib/utils'
import type { NoteDetail } from '@/lib/api'

const schema = z.object({
  title: z.string().trim().min(1, 'Give it a title you will recognise, e.g. “Wi-Fi rumah”.'),
  type: z.string().min(1),
  content: z.string().optional(),
  tags: z.string().optional(),
})

export type NoteFormValues = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<NoteDetail>
  onSubmit: (data: NoteFormValues) => Promise<void>
  isSubmitting?: boolean
  submitLabel: string
  cancelHref: string
}

export function NoteForm({ defaultValues, onSubmit, isSubmitting, submitLabel, cancelHref }: Props) {
  const { register, handleSubmit, setValue, control, formState: { errors, isDirty } } = useForm<NoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      type: defaultValues?.type ?? 'personal',
      content: defaultValues?.content ?? '',
      tags: defaultValues?.tags ?? '',
    },
  })

  useUnsavedChangesWarning(isDirty && !isSubmitting)

  const type = useWatch({ control, name: 'type' })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Panel title="What is it?" description="A title and category help you find it later.">
        <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
          <Field id="title" label="Title" required error={errors.title?.message}>
            <Input {...fieldAria('title', errors.title?.message)} placeholder="e.g. Wi-Fi rumah…" autoComplete="off" {...register('title')} />
          </Field>
          <Field id="type" label="Category">
            <Select value={type} onValueChange={(v) => setValue('type', v, { shouldDirty: true })}>
              <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(NOTE_TYPES).map(([value, { label, icon: Icon }]) => (
                  <SelectItem key={value} value={value}>
                    <Icon aria-hidden="true" />
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field id="tags" label="Tags" className="mt-5" hint="Separate with commas.">
          <Input id="tags" autoComplete="off" placeholder="family, recovery…" aria-describedby="tags-hint" {...register('tags')} />
        </Field>
      </Panel>

      <Panel title="Content" description="Encrypted with your vault key before it is stored.">
        <Field id="content" label="Note" hint="Plain text. Line breaks are kept as you type them.">
          <Textarea
            id="content"
            rows={12}
            aria-describedby="content-hint"
            spellCheck={type !== 'technical'}
            placeholder={type === 'technical' ? 'ssh-ed25519 AAAA…' : 'Recovery codes, account numbers, anything you need to keep private…'}
            className={cn('min-h-56 leading-relaxed', type === 'technical' && 'font-mono text-sm')}
            {...register('content')}
          />
        </Field>
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
