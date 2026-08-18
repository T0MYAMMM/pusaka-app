'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, UserPlus, Trash2, Crown, Shield, Eye, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { orgsApi, type Org, type OrgMember } from '@/lib/api'

const createOrgSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9_-]+$/, 'Only lowercase letters, numbers, hyphens, underscores'),
})

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'member', 'viewer']),
})

type CreateOrgForm = z.infer<typeof createOrgSchema>
type InviteForm = z.infer<typeof inviteSchema>

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3 w-3" />,
  admin: <Shield className="h-3 w-3" />,
  member: <User className="h-3 w-3" />,
  viewer: <Eye className="h-3 w-3" />,
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  admin: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  member: 'bg-green-500/15 text-green-600 dark:text-green-400',
  viewer: 'bg-muted text-muted-foreground',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? ''}`}>
      {ROLE_ICONS[role]}
      {role}
    </span>
  )
}

function CreateOrgForm({ onCreated }: { onCreated: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
  })
  const qc = useQueryClient()

  const onSubmit = async (data: CreateOrgForm) => {
    try {
      await orgsApi.create(data)
      toast.success('Organization created')
      qc.invalidateQueries({ queryKey: ['orgs'] })
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label>Organization name</Label>
        <Input placeholder="Acme Inc" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input placeholder="acme" {...register('slug')} />
        <p className="text-xs text-muted-foreground">Unique identifier — lowercase letters, numbers, hyphens</p>
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create organization'}
      </Button>
    </form>
  )
}

function OrgDetail({ org }: { org: Org }) {
  const qc = useQueryClient()
  const [inviting, setInviting] = useState(false)

  const { data: members = [] } = useQuery({
    queryKey: ['org-members', org.id],
    queryFn: () => orgsApi.listMembers(org.id),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'member' },
  })

  const removeMember = useMutation({
    mutationFn: (userId: number) => orgsApi.removeMember(org.id, userId),
    onSuccess: () => {
      toast.success('Member removed')
      qc.invalidateQueries({ queryKey: ['org-members', org.id] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove member'),
  })

  const onInvite = async (data: InviteForm) => {
    try {
      await orgsApi.invite(org.id, data)
      toast.success(`Invitation sent to ${data.email}`)
      qc.invalidateQueries({ queryKey: ['org-members', org.id] })
      reset()
      setInviting(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold">{org.name}</h2>
          <p className="text-xs text-muted-foreground">/{org.slug} · {org.plan}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Members</h3>
          <Button size="sm" variant="outline" onClick={() => setInviting(!inviting)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Invite
          </Button>
        </div>

        {inviting && (
          <form onSubmit={handleSubmit(onInvite)} className="flex gap-2 items-start rounded-md border p-3">
            <div className="flex-1 space-y-1">
              <Input placeholder="colleague@company.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <select
              {...register('role')}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? '…' : 'Send'}
            </Button>
          </form>
        )}

        <div className="divide-y rounded-md border">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2.5">
              <div>
                <p className="text-sm">{m.invited_email}</p>
                {!m.invite_accepted_at && (
                  <p className="text-xs text-muted-foreground">Invite pending</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <RoleBadge role={m.role} />
                {m.role !== 'owner' && m.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMember.mutate(m.user_id!)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function OrganizationPage() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: orgsApi.list,
  })
  const [creating, setCreating] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId) ?? orgs[0] ?? null

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-muted-foreground">Loading…</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">Manage your teams and shared vaults</p>
      </div>

      {orgs.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {orgs.map((o) => (
            <Button
              key={o.id}
              variant={selectedOrg?.id === o.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setSelectedOrgId(o.id); setCreating(false) }}
            >
              {o.name}
            </Button>
          ))}
        </div>
      )}

      {orgs.length === 0 || creating ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {orgs.length === 0 ? 'Create your first organization' : 'New organization'}
          </h2>
          <CreateOrgForm onCreated={() => setCreating(false)} />
          {orgs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          )}
        </div>
      ) : selectedOrg ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div />
            <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
              + New organization
            </Button>
          </div>
          <OrgDetail org={selectedOrg} />
        </div>
      ) : null}
    </div>
  )
}
