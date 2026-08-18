'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { toast } from 'sonner'
import { Key, FileText, Plus, Trash2, Eye, EyeOff, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { orgsApi, credentialsApi, notesApi, type SharedCredential, type SharedNote } from '@/lib/api'

// The page receives the param as "orgId-vaultId" e.g. "1-3"
function VaultDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [orgId, vaultId] = id.split('-').map(Number)
  const qc = useQueryClient()

  const { data: vault, isLoading: vaultLoading } = useQuery({
    queryKey: ['vault', orgId, vaultId],
    queryFn: () => orgsApi.getVault(orgId, vaultId),
    enabled: !isNaN(orgId) && !isNaN(vaultId),
  })

  const { data: sharedCreds = [] } = useQuery({
    queryKey: ['shared-creds', orgId, vaultId],
    queryFn: () => orgsApi.listSharedCredentials(orgId, vaultId),
    enabled: !isNaN(orgId) && !isNaN(vaultId),
  })

  const { data: sharedNotes = [] } = useQuery({
    queryKey: ['shared-notes', orgId, vaultId],
    queryFn: () => orgsApi.listSharedNotes(orgId, vaultId),
    enabled: !isNaN(orgId) && !isNaN(vaultId),
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
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add credential'),
  })

  const removeCred = useMutation({
    mutationFn: (scId: number) => orgsApi.removeCredentialFromVault(orgId, vaultId, scId),
    onSuccess: () => {
      toast.success('Removed from vault')
      qc.invalidateQueries({ queryKey: ['shared-creds', orgId, vaultId] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove'),
  })

  const addNote = useMutation({
    mutationFn: (noteId: number) => orgsApi.addNoteToVault(orgId, vaultId, noteId),
    onSuccess: () => {
      toast.success('Note added to vault')
      qc.invalidateQueries({ queryKey: ['shared-notes', orgId, vaultId] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add note'),
  })

  const removeNote = useMutation({
    mutationFn: (snId: number) => orgsApi.removeNoteFromVault(orgId, vaultId, snId),
    onSuccess: () => {
      toast.success('Removed from vault')
      qc.invalidateQueries({ queryKey: ['shared-notes', orgId, vaultId] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove'),
  })

  const sharedCredIds = new Set(sharedCreds.map((sc) => sc.credential_id).filter(Boolean))
  const sharedNoteIds = new Set(sharedNotes.map((sn) => sn.note_id).filter(Boolean))

  const availableCreds = myCreds.items.filter((c) => !sharedCredIds.has(c.id))
  const availableNotes = myNotes.items.filter((n) => !sharedNoteIds.has(n.id))

  if (vaultLoading) return <div className="p-4 sm:p-6 text-sm text-muted-foreground">Loading…</div>
  if (!vault) return <div className="p-4 sm:p-6 text-sm text-destructive">Vault not found</div>

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/vaults" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{vault.name}</h1>
          {vault.description && <p className="text-sm text-muted-foreground">{vault.description}</p>}
        </div>
      </div>

      {/* Shared Credentials */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Key className="h-4 w-4" /> Credentials
            <Badge variant="secondary">{sharedCreds.length}</Badge>
          </h2>
          {availableCreds.length > 0 && (
            <select
              className="h-8 rounded-md border bg-background px-2 text-sm"
              onChange={(e) => { if (e.target.value) { addCred.mutate(Number(e.target.value)); e.target.value = '' } }}
              defaultValue=""
            >
              <option value="" disabled>+ Add credential</option>
              {availableCreds.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          )}
        </div>

        {sharedCreds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No credentials in this vault yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {sharedCreds.map((sc) => (
              <SharedCredRow key={sc.id} sc={sc} orgId={orgId} vaultId={vaultId} onRemove={() => removeCred.mutate(sc.id)} />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Shared Notes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4" /> Notes
            <Badge variant="secondary">{sharedNotes.length}</Badge>
          </h2>
          {availableNotes.length > 0 && (
            <select
              className="h-8 rounded-md border bg-background px-2 text-sm"
              onChange={(e) => { if (e.target.value) { addNote.mutate(Number(e.target.value)); e.target.value = '' } }}
              defaultValue=""
            >
              <option value="" disabled>+ Add note</option>
              {availableNotes.map((n) => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          )}
        </div>

        {sharedNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes in this vault yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {sharedNotes.map((sn) => (
              <SharedNoteRow key={sn.id} sn={sn} orgId={orgId} vaultId={vaultId} onRemove={() => removeNote.mutate(sn.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SharedCredRow({
  sc, orgId, vaultId, onRemove,
}: { sc: SharedCredential; orgId: number; vaultId: number; onRemove: () => void }) {
  const [revealed, setRevealed] = useState(false)
  const [password, setPassword] = useState<string | null>(null)

  const reveal = async () => {
    if (revealed) { setRevealed(false); return }
    try {
      const detail = await orgsApi.getSharedCredential(orgId, vaultId, sc.id)
      setPassword(detail.password)
      setRevealed(true)
    } catch {
      toast.error('Failed to decrypt password')
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{sc.label}</p>
        <p className="text-xs text-muted-foreground">{sc.username ?? sc.email ?? sc.website_url ?? sc.type}</p>
        {revealed && password !== null && (
          <p className="font-mono text-xs mt-0.5 text-foreground/80 break-all">{password}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reveal} title={revealed ? 'Hide' : 'Reveal password'}>
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function SharedNoteRow({
  sn, orgId, vaultId, onRemove,
}: { sn: SharedNote; orgId: number; vaultId: number; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState<string | null>(null)

  const toggle = async () => {
    if (expanded) { setExpanded(false); return }
    try {
      const detail = await orgsApi.getSharedNote(orgId, vaultId, sn.id)
      setContent(detail.content)
      setExpanded(true)
    } catch {
      toast.error('Failed to decrypt note')
    }
  }

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <button className="text-sm font-medium text-left hover:underline" onClick={toggle}>
          {sn.title}
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {expanded && content !== null && (
        <p className="mt-2 text-xs text-foreground/80 whitespace-pre-wrap">{content}</p>
      )}
    </div>
  )
}

export default function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <VaultDetailContent params={params} />
    </Suspense>
  )
}
