'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronRight, Vault } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { EmptyState } from '@/components/shared/empty-state'
import { ItemTile } from '@/components/shared/item-tile'
import { VaultCreateDialog } from '@/components/features/vault-create-dialog'
import { orgsApi, type Org, type SharedVault } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useT } from '@/lib/i18n'

function VaultRow({ org, vault }: { org: Org; vault: SharedVault }) {
  const { lang } = useT()
  return (
    <li className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5">
      <ItemTile icon={Vault} tone="indigo" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/vaults/${org.id}-${vault.id}`}
          className="block truncate text-sm font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
        >
          {vault.name}
        </Link>
        <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">
          {vault.description || 'No description'}
        </p>
      </div>
      <span className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground tabular md:block">
        {formatDate(vault.created_at, lang)}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
    </li>
  )
}

function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function OrgVaults({ org }: { org: Org }) {
  const { data: vaults = [], isLoading } = useQuery({
    queryKey: ['vaults', org.id],
    queryFn: () => orgsApi.listVaults(org.id),
  })

  return (
    <section aria-labelledby={`org-${org.id}`} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <h2 id={`org-${org.id}`} className="truncate text-[0.9375rem] font-semibold">{org.name}</h2>
          {!isLoading && <span className="text-sm text-muted-foreground tabular">{vaults.length}</span>}
        </div>
        <VaultCreateDialog org={org} />
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border bg-card"><RowsSkeleton /></div>
      ) : vaults.length === 0 ? (
        <EmptyState
          icon={Vault}
          title={`No vaults in ${org.name} yet`}
          description="Create a vault, then add the credentials and notes everyone in it should be able to use."
          className="py-10 sm:py-12"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {vaults.map((v) => <VaultRow key={v.id} org={org} vault={v} />)}
          </ul>
        </div>
      )}
    </section>
  )
}

export default function VaultsPage() {
  const { t } = useT()
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: orgsApi.list,
  })

  return (
    <PageContainer>
      <PageHeader
        title={t.nav.vaults}
        description="Credentials and notes you share with your family or team, grouped by organization."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="overflow-hidden rounded-xl border bg-card"><RowsSkeleton /></div>
        </div>
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={Vault}
          title="Share safely with the people you trust"
          description="Create an organization for your family or team, then add shared vaults to it."
          action={<Button asChild><Link href="/settings/organization">Create an organization</Link></Button>}
        />
      ) : (
        <div className="space-y-8">
          {orgs.map((org) => <OrgVaults key={org.id} org={org} />)}
        </div>
      )}
    </PageContainer>
  )
}
