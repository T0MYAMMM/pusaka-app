'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Crown, Eye, Loader2, Plus, Shield, User, UserMinus, type LucideIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Panel } from '@/components/shared/page'
import { Field, fieldAria } from '@/components/shared/form'
import { ItemTile } from '@/components/shared/item-tile'
import { StatusPill } from '@/components/shared/badges'
import { ConfirmAction } from '@/components/features/settings-confirm'
import { authApi, orgsApi, type Org, type OrgMember } from '@/lib/api'
import { TONES } from '@/lib/item-meta'
import { cn, formatDate } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const createOrgSchema = z.object({
  name: z.string().trim().min(1, 'Name the organization, e.g. your family or team name.'),
  slug: z
    .string()
    .min(1, 'Choose a short identifier, e.g. “wulandari”.')
    .regex(/^[a-z0-9_-]+$/, 'Use only lowercase letters, numbers, hyphens and underscores.'),
})

const inviteSchema = z.object({
  email: z.string().trim().email('Enter an email like name@example.com.'),
  role: z.enum(['admin', 'member', 'viewer']),
})

type CreateOrgValues = z.infer<typeof createOrgSchema>
type InviteValues = z.infer<typeof inviteSchema>

const ROLES: Record<string, { label: string; icon: LucideIcon; className: string; description?: string }> = {
  owner: { label: 'Owner', icon: Crown, className: TONES.brass },
  admin: { label: 'Admin', icon: Shield, className: TONES.indigo, description: 'Manages members and vaults' },
  member: { label: 'Member', icon: User, className: TONES.slate, description: 'Uses and adds to shared vaults' },
  viewer: { label: 'Viewer', icon: Eye, className: TONES.slate, description: 'Can only view shared items' },
}
const INVITE_ROLES = ['admin', 'member', 'viewer'] as const

const PLAN_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', team: 'Team', team_growth: 'Team Growth' }

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

function RolePill({ role }: { role: string }) {
  const r = ROLES[role] ?? { label: role, icon: User, className: TONES.slate }
  const Icon = r.icon
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold', r.className)}>
      <Icon className="size-3" aria-hidden="true" />
      {r.label}
    </span>
  )
}

function CreateOrgPanel({ first, onDone }: { first: boolean; onDone: (created: boolean) => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting, dirtyFields } } = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: '', slug: '' },
  })

  const onSubmit = async (data: CreateOrgValues) => {
    try {
      await orgsApi.create(data)
      toast.success(`${data.name} created`)
      qc.invalidateQueries({ queryKey: ['orgs'] })
      onDone(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the organization. Try a different identifier.')
    }
  }

  return (
    <Panel
      title={first ? 'Create your first organization' : 'New organization'}
      description="Share vaults with your family or team. You become its owner."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="org-name" label="Name" required error={errors.name?.message}>
            <Input
              {...fieldAria('org-name', errors.name?.message)}
              autoComplete="organization"
              placeholder="e.g. Keluarga Wulandari…"
              {...register('name', {
                onChange: (e) => {
                  // Suggest an identifier until the person edits it themselves.
                  if (!dirtyFields.slug) setValue('slug', slugify(e.target.value))
                },
              })}
            />
          </Field>
          <Field id="org-slug" label="Identifier" required error={errors.slug?.message} hint="Lowercase letters, numbers and hyphens.">
            <Input
              {...fieldAria('org-slug', errors.slug?.message, true)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              placeholder="wulandari"
              {...register('slug')}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          {!first && <Button type="button" variant="ghost" onClick={() => onDone(false)}>Cancel</Button>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Creating…' : 'Create organization'}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function memberInitials(email: string) {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  return ((parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2)) || '?').toUpperCase()
}

function MemberRow({
  m, isYou, onRemove, removing,
}: { m: OrgMember; isYou: boolean; onRemove: () => void; removing: boolean }) {
  const { lang } = useT()
  const pending = !m.invite_accepted_at
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
      <Avatar className="size-9">
        <AvatarFallback className={cn('text-xs font-semibold', m.role === 'owner' ? TONES.brass : TONES.indigo)}>
          {memberInitials(m.invited_email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <span className="truncate" translate="no">{m.invited_email}</span>
          {isYou && <span className="shrink-0 text-xs font-normal text-muted-foreground">(you)</span>}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {pending ? 'Invited' : 'Joined'} {formatDate(m.invite_accepted_at ?? m.created_at, lang)}
        </p>
      </div>
      {pending && <StatusPill tone="warning" className="hidden sm:inline-flex">Invite pending</StatusPill>}
      <RolePill role={m.role} />
      <div className="flex w-8 shrink-0 justify-end">
        {m.role !== 'owner' && m.user_id && (
          <ConfirmAction
            icon={UserMinus}
            triggerLabel={`Remove ${m.invited_email}`}
            title={`Remove ${m.invited_email}?`}
            description="They lose access to this organization’s shared vaults right away. You can invite them again later."
            confirmLabel="Remove member"
            onConfirm={onRemove}
            isPending={removing}
          />
        )}
      </div>
    </li>
  )
}

function OrgDetail({ org, meId, onNew }: { org: Org; meId: number | undefined; onNew: () => void }) {
  const qc = useQueryClient()
  const { lang } = useT()

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['org-members', org.id],
    queryFn: () => orgsApi.listMembers(org.id),
  })

  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'member' },
  })
  const role = useWatch({ control, name: 'role' })

  const removeMember = useMutation({
    mutationFn: (userId: number) => orgsApi.removeMember(org.id, userId),
    onSuccess: () => {
      toast.success('Member removed')
      qc.invalidateQueries({ queryKey: ['org-members', org.id] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove the member. Try again in a moment.'),
  })

  const onInvite = async (data: InviteValues) => {
    try {
      await orgsApi.invite(org.id, data)
      toast.success(`Invitation sent to ${data.email}`)
      qc.invalidateQueries({ queryKey: ['org-members', org.id] })
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the invite. Check the address and try again.')
    }
  }

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-center gap-4">
          <ItemTile icon={Building2} tone="indigo" size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{org.name}</h2>
              <StatusPill tone="neutral">{PLAN_LABELS[org.plan] ?? org.plan}</StatusPill>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span className="font-mono" translate="no">/{org.slug}</span>
              <span aria-hidden="true"> · </span>
              Created {formatDate(org.created_at, lang)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onNew} className="hidden shrink-0 sm:inline-flex">
            <Plus aria-hidden="true" />
            New organization
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onNew} className="mt-4 w-full sm:hidden">
          <Plus aria-hidden="true" />
          New organization
        </Button>
      </Panel>

      <Panel
        title="Members"
        description={isLoading ? undefined : `${members.length} ${members.length === 1 ? 'person' : 'people'} in ${org.name}.`}
        bodyClassName="p-0"
      >
        {isLoading ? (
          <ul className="divide-y" aria-busy="true" aria-label="Loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-44" /><Skeleton className="h-3 w-24" /></div>
                <Skeleton className="h-5 w-16 rounded-md" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                m={m}
                isYou={meId !== undefined && m.user_id === meId}
                onRemove={() => m.user_id && removeMember.mutate(m.user_id)}
                removing={removeMember.isPending && removeMember.variables === m.user_id}
              />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Invite a member" description="They get an email with a link to join. Pending invites show in the list above.">
        <form onSubmit={handleSubmit(onInvite)} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_13rem]">
            <Field id="invite-email" label="Email" required error={errors.email?.message}>
              <Input
                {...fieldAria('invite-email', errors.email?.message)}
                type="email"
                inputMode="email"
                autoComplete="off"
                spellCheck={false}
                placeholder="name@example.com"
                {...register('email')}
              />
            </Field>
            <Field id="invite-role" label="Role">
              <Select value={role} onValueChange={(v) => setValue('role', v as InviteValues['role'])}>
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue>{ROLES[role]?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="flex flex-col">
                        <span className="font-medium">{ROLES[r].label}</span>
                        <span className="text-xs text-muted-foreground">{ROLES[r].description}</span>
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
              {isSubmitting ? 'Sending invite…' : 'Send invite'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

export default function OrganizationPage() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: orgsApi.list,
  })
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: authApi.me })
  const [creating, setCreating] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId) ?? orgs[0] ?? null

  if (isLoading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (orgs.length === 0) {
    return <CreateOrgPanel first onDone={() => {}} />
  }

  return (
    <div className="space-y-5">
      {orgs.length > 1 && (
        <Field id="org-switch" label="Organization" className="w-full sm:w-72">
          <Select
            value={String(selectedOrg?.id ?? '')}
            onValueChange={(v) => { setSelectedOrgId(Number(v)); setCreating(false) }}
          >
            <SelectTrigger id="org-switch" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {orgs.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      )}

      {creating ? (
        <CreateOrgPanel first={false} onDone={() => setCreating(false)} />
      ) : selectedOrg ? (
        <OrgDetail key={selectedOrg.id} org={selectedOrg} meId={me?.id} onNew={() => setCreating(true)} />
      ) : null}
    </div>
  )
}
