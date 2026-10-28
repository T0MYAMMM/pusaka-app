'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CircleMinus, Loader2, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ItemTile } from '@/components/shared/item-tile'
import { SecretText } from '@/components/shared/secret-text'
import { RevealButton } from '@/components/shared/field-row'
import { CopyButton } from '@/components/features/copy-button'
import { ConfirmAction } from '@/components/features/settings-confirm'
import { orgsApi, type SharedCredential, type SharedNote } from '@/lib/api'
import { credentialMeta, noteMeta, type ItemMeta } from '@/lib/item-meta'
import { formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

/** "Add …" picker listing the person's own items that are not in the vault yet. */
export function VaultAddSelect({
  label,
  items,
  onAdd,
  isPending,
}: {
  label: string
  items: { id: number; name: string; meta: ItemMeta }[]
  onAdd: (id: number) => void
  isPending?: boolean
}) {
  return (
    <Select value="" onValueChange={(v) => onAdd(Number(v))} disabled={isPending || items.length === 0}>
      <SelectTrigger size="sm" aria-label={label} className="font-semibold data-[placeholder]:text-foreground">
        {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
        <SelectValue placeholder={items.length === 0 ? 'Nothing to add' : label} />
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="max-h-72 w-72">
        {items.map(({ id, name, meta }) => {
          const Icon = meta.icon
          return (
            <SelectItem key={id} value={String(id)}>
              <Icon aria-hidden="true" />
              <span className="truncate">{name}</span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

const removeCopy = (name: string) => ({
  triggerLabel: `Remove ${name} from vault`,
  title: `Remove “${name}” from this vault?`,
  description: 'Vault members lose access to the shared copy right away. The original stays in its owner’s vault.',
  confirmLabel: 'Remove from vault',
})

export function SharedCredentialRow({
  sc, orgId, vaultId, onRemove, removing,
}: { sc: SharedCredential; orgId: number; vaultId: number; onRemove: () => void; removing: boolean }) {
  const { lang } = useT()
  const meta = credentialMeta(sc.type)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState<string | null>(null)

  const toggle = async () => {
    if (revealed) { setRevealed(false); return }
    if (password !== null) { setRevealed(true); return }
    setLoading(true)
    try {
      const detail = await orgsApi.getSharedCredential(orgId, vaultId, sc.id)
      setPassword(detail.password)
      setRevealed(true)
    } catch {
      toast.error('Could not decrypt the password. Reload the page and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <li className="group flex items-start gap-3 px-4 py-3 sm:gap-4 sm:px-5">
      <ItemTile icon={meta.icon} tone={meta.tone} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{sc.label}</p>
        <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground" translate="no">
          {sc.username ?? sc.email ?? sc.website_url ?? meta.label}
        </p>
        {revealed && password !== null && (
          <SecretText value={password} revealed className="mt-1.5 block text-sm" />
        )}
      </div>
      <span className="hidden w-24 shrink-0 self-center text-right text-xs text-muted-foreground tabular md:block">
        {formatDistanceToNow(sc.added_at, lang)}
      </span>
      <div className="flex shrink-0 items-center gap-0.5 self-center">
        {loading ? (
          <span className="inline-flex size-8 items-center justify-center text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-label="Decrypting…" />
          </span>
        ) : (
          <RevealButton shown={revealed} onToggle={toggle} label={`password for ${sc.label}`} />
        )}
        {revealed && password !== null && <CopyButton value={password} label="Password" />}
        <ConfirmAction icon={CircleMinus} onConfirm={onRemove} isPending={removing} {...removeCopy(sc.label)} />
      </div>
    </li>
  )
}

export function SharedNoteRow({
  sn, orgId, vaultId, onRemove, removing,
}: { sn: SharedNote; orgId: number; vaultId: number; onRemove: () => void; removing: boolean }) {
  const { lang } = useT()
  const meta = noteMeta(sn.type)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string | null>(null)

  const toggle = async () => {
    if (expanded) { setExpanded(false); return }
    if (content !== null) { setExpanded(true); return }
    setLoading(true)
    try {
      const detail = await orgsApi.getSharedNote(orgId, vaultId, sn.id)
      setContent(detail.content)
      setExpanded(true)
    } catch {
      toast.error('Could not decrypt the note. Reload the page and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <ItemTile icon={meta.icon} tone={meta.tone} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{sn.title}</p>
          <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">{meta.label}</p>
        </div>
        <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground tabular md:block">
          {formatDistanceToNow(sn.added_at, lang)}
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          {loading ? (
            <span className="inline-flex size-8 items-center justify-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-label="Decrypting…" />
            </span>
          ) : (
            <RevealButton shown={expanded} onToggle={toggle} label={`note ${sn.title}`} />
          )}
          {expanded && content !== null && <CopyButton value={content} label="Note" />}
          <ConfirmAction icon={CircleMinus} onConfirm={onRemove} isPending={removing} {...removeCopy(sn.title)} />
        </div>
      </div>
      {expanded && content !== null && (
        <p className="mt-3 rounded-lg bg-muted px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words sm:ml-14">
          {content || <span className="text-muted-foreground">This note is empty.</span>}
        </p>
      )}
    </li>
  )
}
