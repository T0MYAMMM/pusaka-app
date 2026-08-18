'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { NoteDetail } from '@/lib/api'

const NOTE_TYPES = ['personal','work','financial','medical','legal','technical','other'] as const

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
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
}

export function NoteForm({ defaultValues, onSubmit, isSubmitting, submitLabel }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      type: defaultValues?.type ?? 'personal',
      content: defaultValues?.content ?? '',
      tags: defaultValues?.tags ?? '',
    },
  })

  const type = watch('type')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" placeholder="e.g. SSH Keys Backup" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {NOTE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" placeholder="ssh, infra (comma-separated)" {...register('tags')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" rows={10} placeholder="Your secure note content…" className="font-mono text-sm" {...register('content')} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
