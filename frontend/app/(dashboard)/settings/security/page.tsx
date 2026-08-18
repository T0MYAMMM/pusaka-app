'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Key, Copy, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { apiKeysApi, type APIKey } from '@/lib/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  scope: z.enum(['read', 'write']),
})
type FormValues = z.infer<typeof schema>

function KeyRow({ apiKey, onRevoke }: { apiKey: APIKey; onRevoke: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm">{apiKey.name}</span>
          <Badge variant={apiKey.scope === 'write' ? 'default' : 'secondary'} className="text-[10px]">
            {apiKey.scope}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{apiKey.key_prefix}…</p>
        {apiKey.last_used_at && (
          <p className="text-xs text-muted-foreground">
            Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRevoke}
        title="Revoke key"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function NewKeyBanner({ apiKey }: { apiKey: string }) {
  const copy = () => {
    navigator.clipboard.writeText(apiKey)
    toast.success('API key copied to clipboard')
  }

  return (
    <div className="rounded-md border border-green-500/30 bg-green-500/10 p-4 space-y-2">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm">
        <AlertTriangle className="h-4 w-4" />
        Save this key — it won&apos;t be shown again
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-background/60 px-3 py-1.5 text-xs font-mono break-all border">
          {apiKey}
        </code>
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default function SecuritySettingsPage() {
  const qc = useQueryClient()
  const [newKey, setNewKey] = useState<string | null>(null)

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.list,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { scope: 'read' },
  })

  const revoke = useMutation({
    mutationFn: (id: number) => apiKeysApi.revoke(id),
    onSuccess: () => {
      toast.success('Key revoked')
      qc.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: () => toast.error('Failed to revoke key'),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await apiKeysApi.create(data)
      setNewKey(result.key)
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      reset()
      toast.success('API key created')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create key')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground">API keys for CLI access and CI/CD credential injection</p>
      </div>

      <Separator />

      {/* CLI usage hint */}
      <div className="rounded-md bg-muted/60 p-4 text-xs font-mono space-y-1">
        <p className="text-muted-foreground"># Install CLI</p>
        <p>pip install -e backend/  <span className="text-muted-foreground"># from repo root</span></p>
        <p className="mt-2 text-muted-foreground"># Authenticate</p>
        <p>cm login</p>
        <p className="mt-2 text-muted-foreground"># Usage</p>
        <p>cm list --env prod</p>
        <p>cm get &quot;GitHub Token&quot;</p>
        <p>cm set &quot;DB_PASSWORD&quot; s3cr3t --env prod</p>
      </div>

      {newKey && <NewKeyBanner apiKey={newKey} />}

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Create new key</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40 space-y-1.5">
            <Label>Key name</Label>
            <Input placeholder="GitHub Actions" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Scope</Label>
            <select
              {...register('scope')}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="read">read — list &amp; get</option>
              <option value="write">write — create &amp; update</option>
            </select>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create key'}
          </Button>
        </form>
      </section>

      <Separator />

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Active keys</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active API keys.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {keys.map((k) => (
              <div key={k.id} className="px-4">
                <KeyRow apiKey={k} onRevoke={() => revoke.mutate(k.id)} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
