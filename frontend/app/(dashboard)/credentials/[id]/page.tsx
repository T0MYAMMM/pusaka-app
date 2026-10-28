'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExternalLink, KeyRound, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CredentialTypeBadge } from '@/components/features/credential-type-badge'
import { FavoriteButton } from '@/components/features/favorite-button'
import { CopyButton } from '@/components/features/copy-button'
import { DeleteDialog } from '@/components/features/delete-dialog'
import { PageContainer, PageHeader, Panel } from '@/components/shared/page'
import { ItemTile } from '@/components/shared/item-tile'
import { EmptyState } from '@/components/shared/empty-state'
import { SecretText } from '@/components/shared/secret-text'
import { FieldRow, RevealButton } from '@/components/shared/field-row'
import { EnvBadge, ExpiryBadge, StatusPill, TagList } from '@/components/shared/badges'
import { MetaList } from '@/components/shared/kbd'
import { credentialsApi } from '@/lib/api'
import { credentialMeta, daysUntil } from '@/lib/item-meta'
import { passwordStrength } from '@/lib/password'
import { formatDate, formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const STRENGTH_TONE = { Weak: 'danger', Fair: 'warning', Good: 'info', Strong: 'success' } as const

export default function CredentialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const { t, lang } = useT()
  const [showPass, setShowPass] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['credential', id],
    queryFn: () => credentialsApi.get(Number(id)),
  })

  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: () => credentialsApi.delete(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credentials'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Credential deleted')
      router.push('/credentials')
    },
    onError: () => toast.error('Could not delete. Try again in a moment.'),
  })

  if (isLoading) {
    return (
      <PageContainer className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-xl" />
          <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  if (!data) {
    return (
      <PageContainer>
        <EmptyState
          icon={KeyRound}
          title="This credential doesn’t exist"
          description="It may have been deleted, or the link is wrong."
          action={<Button asChild variant="outline"><Link href="/credentials">Back to credentials</Link></Button>}
        />
      </PageContainer>
    )
  }

  const meta = credentialMeta(data.type)
  const strength = passwordStrength(data.password)
  const days = daysUntil(data.expires_at)

  return (
    <PageContainer>
      <PageHeader
        back={{ href: '/credentials', label: t.nav.credentials }}
        leading={<ItemTile icon={meta.icon} tone={meta.tone} size="lg" />}
        title={data.label}
        actions={
          <>
            <FavoriteButton id={data.id} kind="credential" isFavorite={data.is_favorite} queryKey={['credential', id]} className="size-10" />
            <Button variant="outline" asChild>
              <Link href={`/credentials/${id}/edit`}><Pencil aria-hidden="true" />{t.common.edit}</Link>
            </Button>
            <DeleteDialog itemName={data.label} onConfirm={() => doDelete()} isPending={deleting} />
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <CredentialTypeBadge type={data.type} />
          <EnvBadge env={data.env} />
          <ExpiryBadge expiresAt={data.expires_at} />
          <TagList tags={data.tags} />
        </div>
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          <section aria-label="Sign-in details" className="divide-y overflow-hidden rounded-xl border bg-card">
            {data.website_url && (
              <FieldRow
                label="Website"
                actions={
                  <>
                    <CopyButton value={data.website_url} label="Website" />
                    <Button variant="ghost" size="icon-sm" asChild className="text-muted-foreground hover:text-foreground">
                      <a href={data.website_url} target="_blank" rel="noopener noreferrer" aria-label="Open website in a new tab">
                        <ExternalLink aria-hidden="true" />
                      </a>
                    </Button>
                  </>
                }
              >
                <a href={data.website_url} target="_blank" rel="noopener noreferrer" className="block truncate font-medium text-primary hover:underline">
                  {data.website_url}
                </a>
              </FieldRow>
            )}
            {data.username && (
              <FieldRow label="Username" actions={<CopyButton value={data.username} label="Username" />}>
                <span className="block truncate font-medium" translate="no">{data.username}</span>
              </FieldRow>
            )}
            {data.email && (
              <FieldRow label="Email" actions={<CopyButton value={data.email} label="Email" />}>
                <span className="block truncate font-medium" translate="no">{data.email}</span>
              </FieldRow>
            )}
            <FieldRow
              label="Password"
              actions={
                <>
                  <RevealButton shown={showPass} onToggle={() => setShowPass((s) => !s)} label="password" />
                  <CopyButton value={data.password} label="Password" />
                </>
              }
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <SecretText value={data.password} revealed={showPass} className="text-base" />
                {strength.label && <StatusPill tone={STRENGTH_TONE[strength.label]}>{strength.label}</StatusPill>}
              </div>
            </FieldRow>
            {data.secret_key && (
              <FieldRow
                label="Secret key or 2FA seed"
                actions={
                  <>
                    <RevealButton shown={showSecret} onToggle={() => setShowSecret((s) => !s)} label="secret key" />
                    <CopyButton value={data.secret_key} label="Secret key" />
                  </>
                }
              >
                <SecretText value={data.secret_key} revealed={showSecret} className="text-base" />
              </FieldRow>
            )}
          </section>

          {data.note && (
            <Panel title="Notes">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{data.note}</p>
            </Panel>
          )}
        </div>

        <aside className="space-y-5">
          <Panel title="Details">
            <MetaList
              items={[
                { label: 'Category', value: meta.label },
                { label: 'Environment', value: <span className="capitalize">{data.env || 'global'}</span> },
                ...(data.expires_at
                  ? [{
                      label: 'Expires',
                      value: (
                        <span className={days !== null && days < 0 ? 'text-destructive' : days !== null && days <= 14 ? 'text-warning' : undefined}>
                          {formatDate(data.expires_at, lang)}
                        </span>
                      ),
                    }]
                  : []),
                { label: 'Created', value: formatDate(data.created_at, lang) },
                { label: 'Updated', value: formatDistanceToNow(data.updated_at, lang) },
                ...(data.last_accessed ? [{ label: 'Last viewed', value: formatDistanceToNow(data.last_accessed, lang) }] : []),
              ]}
            />
          </Panel>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Copied values are cleared from your clipboard after 30 seconds.
          </p>
        </aside>
      </div>
    </PageContainer>
  )
}
