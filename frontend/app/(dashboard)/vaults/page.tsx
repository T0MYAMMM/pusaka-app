'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Vault, Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { orgsApi, type Org, type SharedVault } from '@/lib/api'

const createVaultSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})
type CreateVaultForm = z.infer<typeof createVaultSchema>

function VaultCard({ org, vault }: { org: Org; vault: SharedVault }) {
  return (
    <Link
      href={`/vaults/${org.id}-${vault.id}`}
      className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <Vault className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{vault.name}</p>
          {vault.description && <p className="text-xs text-muted-foreground">{vault.description}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">{org.name}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

function OrgVaults({ org }: { org: Org }) {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)

  const { data: vaults = [] } = useQuery({
    queryKey: ['vaults', org.id],
    queryFn: () => orgsApi.listVaults(org.id),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateVaultForm>({
    resolver: zodResolver(createVaultSchema),
  })

  const onSubmit = async (data: CreateVaultForm) => {
    try {
      await orgsApi.createVault(org.id, data)
      toast.success('Vault created')
      qc.invalidateQueries({ queryKey: ['vaults', org.id] })
      reset()
      setCreating(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create vault')
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{org.name}</h2>
        <Button size="sm" variant="outline" onClick={() => setCreating(!creating)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          New vault
        </Button>
      </div>

      {creating && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border p-4">
          <div className="space-y-1.5">
            <Label>Vault name</Label>
            <Input placeholder="Production Secrets" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input placeholder="Credentials for production infrastructure" {...register('description')} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {vaults.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No vaults yet.</p>
      ) : (
        <div className="grid gap-2">
          {vaults.map((v) => <VaultCard key={v.id} org={org} vault={v} />)}
        </div>
      )}
    </section>
  )
}

export default function VaultsPage() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: orgsApi.list,
  })

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-muted-foreground">Loading…</div>
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shared Vaults</h1>
        <p className="text-sm text-muted-foreground">Team credentials shared across your organizations</p>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Vault className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            You don&apos;t belong to any organizations yet.{' '}
            <a href="/settings/organization" className="underline underline-offset-4 hover:text-foreground">
              Create one
            </a>{' '}
            to start sharing credentials with your team.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orgs.map((org) => <OrgVaults key={org.id} org={org} />)}
        </div>
      )}
    </div>
  )
}
