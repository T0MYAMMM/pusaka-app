'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Field, fieldAria } from '@/components/shared/form'
import { orgsApi, type Org } from '@/lib/api'

const schema = z.object({
  name: z.string().trim().min(1, 'Name the vault after what it holds, e.g. “Household bills”.'),
  description: z.string().optional(),
})
type Values = z.infer<typeof schema>

/** "New vault" button and its dialog for one organization. */
export function VaultCreateDialog({ org, variant = 'outline' }: { org: Org; variant?: 'outline' | 'default' }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })

  const onSubmit = async (data: Values) => {
    try {
      await orgsApi.createVault(org.id, data)
      toast.success(`${data.name} created`)
      qc.invalidateQueries({ queryKey: ['vaults', org.id] })
      reset()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the vault. Try again in a moment.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          <Plus aria-hidden="true" />
          New vault
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New vault in {org.name}</DialogTitle>
          <DialogDescription>Members of the vault can see and use everything you add to it.</DialogDescription>
        </DialogHeader>
        <form id={`vault-create-${org.id}`} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Field id={`vault-name-${org.id}`} label="Name" required error={errors.name?.message}>
            <Input
              {...fieldAria(`vault-name-${org.id}`, errors.name?.message)}
              autoComplete="off"
              placeholder="e.g. Household bills…"
              {...register('name')}
            />
          </Field>
          <Field id={`vault-desc-${org.id}`} label="Description" hint="Optional — what belongs here.">
            <Input
              {...fieldAria(`vault-desc-${org.id}`, undefined, true)}
              autoComplete="off"
              placeholder="e.g. Electricity, water and internet logins…"
              {...register('description')}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form={`vault-create-${org.id}`} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Creating…' : 'Create vault'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
