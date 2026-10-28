'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Panel } from '@/components/shared/page'
import { Field, fieldAria } from '@/components/shared/form'
import { ItemTile } from '@/components/shared/item-tile'
import { StatusPill } from '@/components/shared/badges'
import { EmptyState } from '@/components/shared/empty-state'
import { CopyButton } from '@/components/features/copy-button'
import { ConfirmAction } from '@/components/features/settings-confirm'
import { apiKeysApi, type APIKey } from '@/lib/api'
import { formatDate, formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const schema = z.object({
  name: z.string().trim().min(1, 'Name the key after where it is used, e.g. “GitHub Actions”.'),
  scope: z.enum(['read', 'write']),
})
type FormValues = z.infer<typeof schema>

const SCOPES = [
  { value: 'read', label: 'Read', description: 'List and get credentials' },
  { value: 'write', label: 'Write', description: 'Also create and update credentials' },
] as const

const CLI_STEPS: { comment: string; lines: string[] }[] = [
  { comment: 'Install the CLI (from the repository root)', lines: ['pip install -e backend/'] },
  { comment: 'Sign in with an API key', lines: ['cm login'] },
  { comment: 'Read and write secrets', lines: ['cm list --env prod', 'cm get "GitHub Token"', 'cm set "DB_PASSWORD" s3cr3t --env prod'] },
]

function KeyRow({ apiKey, onRevoke, revoking }: { apiKey: APIKey; onRevoke: () => void; revoking: boolean }) {
  const { lang } = useT()
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
      <ItemTile icon={KeyRound} tone="indigo" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold">{apiKey.name}</p>
          <StatusPill tone={apiKey.scope === 'write' ? 'warning' : 'info'}>
            {apiKey.scope === 'write' ? 'Write' : 'Read'}
          </StatusPill>
        </div>
        <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span className="font-mono" translate="no">{apiKey.key_prefix}…</span>
          <span aria-hidden="true">·</span>
          <span>Created {formatDate(apiKey.created_at, lang)}</span>
        </p>
      </div>
      <span className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground tabular sm:block">
        {apiKey.last_used_at ? `Used ${formatDistanceToNow(apiKey.last_used_at, lang)}` : 'Never used'}
      </span>
      <ConfirmAction
        triggerLabel={`Revoke ${apiKey.name}`}
        title={`Revoke “${apiKey.name}”?`}
        description="Anything using this key — scripts, CI jobs, the CLI — stops working immediately. This cannot be undone; you can create a new key afterwards."
        confirmLabel="Revoke key"
        onConfirm={onRevoke}
        isPending={revoking}
      />
    </li>
  )
}

function NewKeyNotice({ apiKey, onDone }: { apiKey: string; onDone: () => void }) {
  return (
    <section role="status" aria-labelledby="new-key-title" className="rounded-xl border border-brass/40 bg-brass-soft p-5">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-brass-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-0.5">
            <h2 id="new-key-title" className="text-[0.9375rem] font-semibold text-brass-foreground">Copy your new key now</h2>
            <p className="text-sm text-brass-foreground/90">
              It is shown only once. Store it in your CI secrets or password manager before you leave this page.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-card py-1 pl-3 pr-1">
            <code className="min-w-0 flex-1 break-all py-1 font-mono text-[0.8125rem]" translate="no">{apiKey}</code>
            <CopyButton value={apiKey} label="API key" />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onDone}>I’ve saved it</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function SecuritySettingsPage() {
  const qc = useQueryClient()
  const { t } = useT()
  const [newKey, setNewKey] = useState<string | null>(null)

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.list,
  })

  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', scope: 'read' },
  })
  const scope = useWatch({ control, name: 'scope' })

  const revoke = useMutation({
    mutationFn: (id: number) => apiKeysApi.revoke(id),
    onSuccess: () => {
      toast.success('Key revoked')
      qc.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: () => toast.error('Could not revoke the key. Try again in a moment.'),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await apiKeysApi.create(data)
      setNewKey(result.key)
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      reset()
      toast.success('API key created')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the key. Try again in a moment.')
    }
  }

  return (
    <div className="space-y-5">
      <Panel title="Use the command line" description={t.settings.securitySubtitle}>
        <pre className="overflow-x-auto rounded-lg border bg-muted px-4 py-3 font-mono text-[0.8125rem] leading-relaxed">
          <code translate="no">
            {CLI_STEPS.map((step, i) => (
              <span key={step.comment} className={i > 0 ? 'mt-3 block' : 'block'}>
                <span className="text-muted-foreground"># {step.comment}</span>
                {step.lines.map((line) => <span key={line} className="block">{line}</span>)}
              </span>
            ))}
          </code>
        </pre>
      </Panel>

      {newKey && <NewKeyNotice apiKey={newKey} onDone={() => setNewKey(null)} />}

      <Panel title="Create an API key" description="Each key works until you revoke it. Use one key per tool so you can revoke them separately.">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_15rem]">
            <Field id="key-name" label="Key name" required error={errors.name?.message}>
              <Input
                {...fieldAria('key-name', errors.name?.message)}
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. GitHub Actions…"
                {...register('name')}
              />
            </Field>
            <Field id="key-scope" label="Access">
              <Select value={scope} onValueChange={(v) => setValue('scope', v as FormValues['scope'])}>
                <SelectTrigger id="key-scope" className="w-full">
                  <SelectValue>{SCOPES.find((s) => s.value === scope)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex flex-col">
                        <span className="font-medium">{s.label}</span>
                        <span className="text-xs text-muted-foreground">{s.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Creating key…' : 'Create API key'}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Active keys"
        description={keys.length ? `${keys.length} ${keys.length === 1 ? 'key' : 'keys'} can access your vault.` : undefined}
        bodyClassName="p-0"
      >
        {isLoading ? (
          <ul className="divide-y" aria-busy="true" aria-label="Loading">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3 w-24" /></div>
              </li>
            ))}
          </ul>
        ) : keys.length === 0 ? (
          <EmptyState
            compact
            icon={KeyRound}
            title="No API keys yet"
            description="Create one above to use the CLI or inject secrets into CI."
          />
        ) : (
          <ul className="divide-y">
            {keys.map((k) => (
              <KeyRow
                key={k.id}
                apiKey={k}
                onRevoke={() => revoke.mutate(k.id)}
                revoking={revoke.isPending && revoke.variables === k.id}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
