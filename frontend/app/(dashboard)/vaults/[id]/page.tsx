'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound, StickyNote, Vault } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, PageHeader, Panel } from '@/components/shared/page'
import { ItemTile } from '@/components/shared/item-tile'
import { EmptyState } from '@/components/shared/empty-state'
import { MetaList } from '@/components/shared/kbd'
import { SharedCredentialRow, SharedNoteRow, VaultAddSelect } from '@/components/features/vault-items'
import { orgsApi, credentialsApi, notesApi } from '@/lib/api'
import { credentialMeta, noteMeta } from '@/lib/item-meta'
import { formatDate } from '@/lib/utils'
import { useT } from '@/lib/i18n'

function RowsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-28" /></div>
        </li>
      ))}
    </ul>
  )
}

// The route param is "orgId-vaultId", e.g. "1-3".
export default function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [orgId, vaultId] = id.split('-').map(Number)
  const valid = !isNaN(orgId) && !isNaN(vaultId)
  const qc = useQueryClient()
  const { t, lang } = useT()

  const { data: vault, isLoading: vaultLoading } = useQuery({
    queryKey: ['vault', orgId, vaultId],
    queryFn: () => orgsApi.getVault(orgId, vaultId),
    enabled: valid,
  })

  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: orgsApi.list })
  const org = orgs.find((o) => o.id === orgId)

  const { data: sharedCreds = [], isLoading: credsLoading } = useQuery({
    queryKey: ['shared-creds', orgId, vaultId],
    queryFn: () => orgsApi.listSharedCredentials(orgId, vaultId),
    enabled: valid,
  })

  const { data: sharedNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['shared-notes', orgId, vaultId],
    queryFn: () => orgsApi.listSharedNotes(orgId, vaultId),
    enabled: valid,
  })

  const { data: myCreds = { items: [] } } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => credentialsApi.list({ limit: 100 }),
  })

  const { data: myNotes = { items: [] } } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.list({ limit: 100 }),
  })

  const addCred = useMutation({
    mutationFn: (credId: number) => orgsApi.addCredentialToVault(orgId, vaultId, credId),
    onSuccess: () => {
      toast.success('Credential added to vault')
      qc.invalidateQueries({ queryKey: ['shared-creds', orgId, vaultId] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add the credential. Try again in a moment.'),
  })

  const removeCred = useMutation({
    mutationFn: (scId: number) => orgsApi.removeCredentialFromVault(orgId, vaultId, scId),
    onSuccess: () => {
      toast.success('Removed from vault')
      qc.invalidateQueries({ queryKey: ['shared-creds', orgId, vaultId] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove it. Try again in a moment.'),
  })

  const addNote = useMutation({
    mutationFn: (noteId: number) => orgsApi.addNoteToVault(orgId, vaultId, noteId),
    onSuccess: () => {
      toast.success('Note added to vault')
      qc.invalidateQueries({ queryKey: ['shared-notes', orgId, vaultId] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add the note. Try again in a moment.'),
  })

  const removeNote = useMutation({
    mutationFn: (snId: number) => orgsApi.removeNoteFromVault(orgId, vaultId, snId),
    onSuccess: () => {
      toast.success('Removed from vault')
      qc.invalidateQueries({ queryKey: ['shared-notes', orgId, vaultId] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove it. Try again in a moment.'),
  })

  const sharedCredIds = new Set(sharedCreds.map((sc) => sc.credential_id).filter(Boolean))
  const sharedNoteIds = new Set(sharedNotes.map((sn) => sn.note_id).filter(Boolean))

  const availableCreds = myCreds.items
    .filter((c) => !sharedCredIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.label, meta: credentialMeta(c.type) }))
  const availableNotes = myNotes.items
    .filter((n) => !sharedNoteIds.has(n.id))
    .map((n) => ({ id: n.id, name: n.title, meta: noteMeta(n.type) }))

  if (valid && vaultLoading) {
    return (
      <PageContainer className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-xl" />
          <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-40" /></div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  if (!vault) {
    return (
      <PageContainer>
        <EmptyState
          icon={Vault}
          title="This vault doesn’t exist"
          description="It may have been deleted, or you are no longer a member. Ask the organization owner if you need access."
          action={<Button asChild variant="outline"><Link href="/vaults">Back to shared vaults</Link></Button>}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        back={{ href: '/vaults', label: t.nav.vaults }}
        leading={<ItemTile icon={Vault} tone="indigo" size="lg" />}
        title={vault.name}
        description={vault.description || (org ? `Shared in ${org.name}` : undefined)}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-5">
          <Panel
            title={<>Credentials <span className="ml-1 font-normal text-muted-foreground tabular">{sharedCreds.length}</span></>}
            action={
              <VaultAddSelect label="Add credential" items={availableCreds} onAdd={(cid) => addCred.mutate(cid)} isPending={addCred.isPending} />
            }
            bodyClassName="p-0"
          >
            {credsLoading ? (
              <RowsSkeleton />
            ) : sharedCreds.length === 0 ? (
              <EmptyState
                compact
                icon={KeyRound}
                title="No credentials shared yet"
                description="Pick one of yours with “Add credential”. Everyone in this vault can then reveal and copy it."
              />
            ) : (
              <ul className="divide-y">
                {sharedCreds.map((sc) => (
                  <SharedCredentialRow
                    key={sc.id}
                    sc={sc}
                    orgId={orgId}
                    vaultId={vaultId}
                    onRemove={() => removeCred.mutate(sc.id)}
                    removing={removeCred.isPending && removeCred.variables === sc.id}
                  />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title={<>Notes <span className="ml-1 font-normal text-muted-foreground tabular">{sharedNotes.length}</span></>}
            action={
              <VaultAddSelect label="Add note" items={availableNotes} onAdd={(nid) => addNote.mutate(nid)} isPending={addNote.isPending} />
            }
            bodyClassName="p-0"
          >
            {notesLoading ? (
              <RowsSkeleton />
            ) : sharedNotes.length === 0 ? (
              <EmptyState
                compact
                icon={StickyNote}
                title="No notes shared yet"
                description="Add a secure note — Wi-Fi details, account numbers, instructions for the family."
              />
            ) : (
              <ul className="divide-y">
                {sharedNotes.map((sn) => (
                  <SharedNoteRow
                    key={sn.id}
                    sn={sn}
                    orgId={orgId}
                    vaultId={vaultId}
                    onRemove={() => removeNote.mutate(sn.id)}
                    removing={removeNote.isPending && removeNote.variables === sn.id}
                  />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Details">
            <MetaList
              items={[
                ...(org ? [{ label: 'Organization', value: org.name }] : []),
                { label: 'Credentials', value: <span className="tabular">{sharedCreds.length}</span> },
                { label: 'Notes', value: <span className="tabular">{sharedNotes.length}</span> },
                { label: 'Created', value: formatDate(vault.created_at, lang) },
              ]}
            />
          </Panel>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Items you add are shared as a copy. Editing the original later does not update the vault — remove and add it again.
          </p>
        </aside>
      </div>
    </PageContainer>
  )
}
