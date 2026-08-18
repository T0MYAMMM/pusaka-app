'use client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type ApiOptions = RequestInit & { params?: Record<string, string | number | boolean | undefined> }

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...init } = options

  let url = `${API_URL}${path}`
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) url += `?${qs}`
  }

  const isFormData = init.body instanceof FormData
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: isFormData
      ? { ...init.headers as Record<string, string> }
      : { 'Content-Type': 'application/json', ...init.headers as Record<string, string> },
  })

  if (res.status === 204) return undefined as T

  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail ?? `Request failed: ${res.status}`)
  return data as T
}

// --- Auth ---
export const authApi = {
  register: (body: { username: string; email: string; first_name: string; last_name: string; password: string }) =>
    request<User>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { username: string; password: string }) =>
    request<User>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request<void>('/api/v1/auth/logout', { method: 'POST' }),

  me: () => request<User>('/api/v1/auth/me'),

  changePassword: (body: { current_password: string; new_password: string }) =>
    request<User>('/api/v1/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),

  updateProfile: (body: { first_name?: string; last_name?: string }) =>
    request<User>('/api/v1/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),

  verifyEmail: (token: string) =>
    request<{ detail: string }>(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, { method: 'POST' }),

  resendVerification: () =>
    request<{ detail: string }>('/api/v1/auth/resend-verification', { method: 'POST' }),

  forgotPassword: (email: string) =>
    request<{ detail: string }>('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (body: { token: string; new_password: string }) =>
    request<{ detail: string }>('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
}

// --- Credentials ---
export const credentialsApi = {
  list: (params?: { q?: string; type?: string; env?: string; favorites_only?: boolean; page?: number; limit?: number }) =>
    request<PaginatedCredentials>('/api/v1/credentials/', { params }),

  get: (id: number) => request<CredentialDetail>(`/api/v1/credentials/${id}`),

  create: (body: CredentialCreate) =>
    request<Credential>('/api/v1/credentials/', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: number, body: Partial<CredentialCreate>) =>
    request<Credential>(`/api/v1/credentials/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (id: number) => request<void>(`/api/v1/credentials/${id}`, { method: 'DELETE' }),

  toggleFavorite: (id: number) =>
    request<Credential>(`/api/v1/credentials/${id}/favorite`, { method: 'POST' }),

  expiring: (days?: number) =>
    request<Credential[]>('/api/v1/credentials/expiring', { params: days ? { days } : undefined }),

  duplicates: () => request<DuplicateGroup[]>('/api/v1/credentials/duplicates'),
}

// --- API Keys ---
export const apiKeysApi = {
  list: () => request<APIKey[]>('/api/v1/api-keys/'),

  create: (body: { name: string; scope: 'read' | 'write' }) =>
    request<APIKeyCreated>('/api/v1/api-keys/', { method: 'POST', body: JSON.stringify(body) }),

  revoke: (id: number) => request<void>(`/api/v1/api-keys/${id}`, { method: 'DELETE' }),
}

// --- Notes ---
export const notesApi = {
  list: (params?: { q?: string; favorites_only?: boolean; page?: number; limit?: number }) =>
    request<PaginatedNotes>('/api/v1/notes/', { params }),

  get: (id: number) => request<NoteDetail>(`/api/v1/notes/${id}`),

  create: (body: NoteCreate) =>
    request<Note>('/api/v1/notes/', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: number, body: Partial<NoteCreate>) =>
    request<Note>(`/api/v1/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (id: number) => request<void>(`/api/v1/notes/${id}`, { method: 'DELETE' }),

  toggleFavorite: (id: number) =>
    request<Note>(`/api/v1/notes/${id}/favorite`, { method: 'POST' }),
}

// --- Organizations ---
export const orgsApi = {
  list: () => request<Org[]>('/api/v1/orgs/'),

  create: (body: { name: string; slug: string }) =>
    request<Org>('/api/v1/orgs/', { method: 'POST', body: JSON.stringify(body) }),

  get: (orgId: number) => request<Org>(`/api/v1/orgs/${orgId}`),

  update: (orgId: number, body: { name?: string }) =>
    request<Org>(`/api/v1/orgs/${orgId}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (orgId: number) => request<void>(`/api/v1/orgs/${orgId}`, { method: 'DELETE' }),

  acceptInvite: (token: string) =>
    request<OrgMember>(`/api/v1/orgs/accept-invite?token=${encodeURIComponent(token)}`, { method: 'POST' }),

  // Members
  listMembers: (orgId: number) => request<OrgMember[]>(`/api/v1/orgs/${orgId}/members`),

  invite: (orgId: number, body: { email: string; role?: string }) =>
    request<OrgMember>(`/api/v1/orgs/${orgId}/invite`, { method: 'POST', body: JSON.stringify(body) }),

  removeMember: (orgId: number, userId: number) =>
    request<void>(`/api/v1/orgs/${orgId}/members/${userId}`, { method: 'DELETE' }),

  updateRole: (orgId: number, userId: number, role: string) =>
    request<OrgMember>(`/api/v1/orgs/${orgId}/members/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  // Shared vaults
  listVaults: (orgId: number) => request<SharedVault[]>(`/api/v1/orgs/${orgId}/vaults`),

  createVault: (orgId: number, body: { name: string; description?: string }) =>
    request<SharedVault>(`/api/v1/orgs/${orgId}/vaults`, { method: 'POST', body: JSON.stringify(body) }),

  getVault: (orgId: number, vaultId: number) => request<SharedVault>(`/api/v1/orgs/${orgId}/vaults/${vaultId}`),

  updateVault: (orgId: number, vaultId: number, body: { name?: string; description?: string }) =>
    request<SharedVault>(`/api/v1/orgs/${orgId}/vaults/${vaultId}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteVault: (orgId: number, vaultId: number) =>
    request<void>(`/api/v1/orgs/${orgId}/vaults/${vaultId}`, { method: 'DELETE' }),

  // Vault members
  listVaultMembers: (orgId: number, vaultId: number) =>
    request<VaultMember[]>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/members`),

  addVaultMember: (orgId: number, vaultId: number, body: { user_id: number; can_write?: boolean }) =>
    request<VaultMember>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/members`, { method: 'POST', body: JSON.stringify(body) }),

  removeVaultMember: (orgId: number, vaultId: number, userId: number) =>
    request<void>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/members/${userId}`, { method: 'DELETE' }),

  // Shared credentials
  listSharedCredentials: (orgId: number, vaultId: number) =>
    request<SharedCredential[]>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/credentials`),

  getSharedCredential: (orgId: number, vaultId: number, scId: number) =>
    request<SharedCredentialDetail>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/credentials/${scId}`),

  addCredentialToVault: (orgId: number, vaultId: number, credentialId: number) =>
    request<SharedCredential>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/credentials/${credentialId}`, { method: 'POST' }),

  removeCredentialFromVault: (orgId: number, vaultId: number, scId: number) =>
    request<void>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/credentials/${scId}`, { method: 'DELETE' }),

  // Shared notes
  listSharedNotes: (orgId: number, vaultId: number) =>
    request<SharedNote[]>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/notes`),

  getSharedNote: (orgId: number, vaultId: number, snId: number) =>
    request<SharedNoteDetail>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/notes/${snId}`),

  addNoteToVault: (orgId: number, vaultId: number, noteId: number) =>
    request<SharedNote>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/notes/${noteId}`, { method: 'POST' }),

  removeNoteFromVault: (orgId: number, vaultId: number, snId: number) =>
    request<void>(`/api/v1/orgs/${orgId}/vaults/${vaultId}/notes/${snId}`, { method: 'DELETE' }),
}

// --- Billing ---
export const billingApi = {
  checkout: (body: { price_id: string; org_id?: number; success_url: string; cancel_url: string }) =>
    request<{ url: string }>('/api/v1/billing/checkout', { method: 'POST', body: JSON.stringify(body) }),

  portal: (body: { org_id?: number; return_url: string }) =>
    request<{ url: string }>('/api/v1/billing/portal', { method: 'POST', body: JSON.stringify(body) }),
}

// --- Documents ---
export const documentsApi = {
  list: (params?: { q?: string; type_filter?: string; favorites_only?: boolean; page?: number; limit?: number }) =>
    request<PaginatedDocuments>('/api/v1/documents/', { params }),

  get: (id: number) => request<Document>(`/api/v1/documents/${id}`),

  upload: (form: FormData) =>
    request<Document>('/api/v1/documents/', { method: 'POST', body: form }),

  update: (id: number, body: Partial<DocumentUpdate>) =>
    request<Document>(`/api/v1/documents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (id: number) => request<void>(`/api/v1/documents/${id}`, { method: 'DELETE' }),

  toggleFavorite: (id: number) =>
    request<Document>(`/api/v1/documents/${id}/favorite`, { method: 'POST' }),

  downloadUrl: (id: number) => `${API_URL}/api/v1/documents/${id}/download`,
}

// --- Dashboard ---
export const dashboardApi = {
  stats: () => request<DashboardStats>('/api/v1/dashboard'),
  search: (params: { q: string; type?: string; favorites_only?: boolean }) =>
    request<SearchResult>('/api/v1/search', { params }),
  activity: (params?: { page?: number; limit?: number }) =>
    request<PaginatedActivity>('/api/v1/activity', { params }),
  export: () => `${API_URL}/api/v1/export`,
}

// --- Types (mirrors backend schemas) ---
export interface User {
  id: number; username: string; email: string; first_name: string; last_name: string
  is_active: boolean; is_email_verified: boolean; created_at: string
  plan: string; stripe_customer_id: string | null
}

export interface Credential {
  id: number; label: string; type: string; website_url: string | null
  username: string | null; email: string | null; note: string | null
  is_favorite: boolean; tags: string | null
  env: string; expires_at: string | null
  created_at: string; updated_at: string; last_accessed: string | null
}

export interface CredentialDetail extends Credential {
  password: string; secret_key: string | null
}

export interface CredentialCreate {
  label: string; type?: string; website_url?: string | null
  username?: string | null; email?: string | null; password?: string
  secret_key?: string | null; note?: string | null
  is_favorite?: boolean; tags?: string | null
  env?: string; expires_at?: string | null
}

export interface PaginatedCredentials {
  items: Credential[]; total: number; page: number; limit: number; pages: number
}

export interface Note {
  id: number; title: string; type: string; is_favorite: boolean; tags: string | null
  created_at: string; updated_at: string; last_accessed: string | null
}

export interface NoteDetail extends Note { content: string }

export interface NoteCreate {
  title: string; content?: string; type?: string; is_favorite?: boolean; tags?: string | null
}

export interface PaginatedNotes {
  items: Note[]; total: number; page: number; limit: number; pages: number
}

export interface ActivityItem {
  id: number; action: string; description: string; ip_address: string | null; timestamp: string
}

export interface PaginatedActivity {
  items: ActivityItem[]; total: number; page: number; limit: number; pages: number
}

export interface DashboardStats {
  total_credentials: number; total_notes: number; total_documents: number
  favorite_credentials: number; favorite_notes: number
  recent_credentials: Credential[]; recent_notes: Note[]
  recent_activities: ActivityItem[]
  credential_types: { type: string; count: number }[]
}

export interface SearchResult {
  credentials: Credential[]; notes: Note[]
  total_credentials: number; total_notes: number
}

// --- Organization types ---
export interface Org {
  id: number; name: string; slug: string; plan: string; owner_id: number; created_at: string
}

export interface OrgMember {
  id: number; user_id: number | null; role: string
  invited_email: string; invite_accepted_at: string | null; created_at: string
}

export interface SharedVault {
  id: number; org_id: number; name: string; description: string | null
  created_by: number; created_at: string
}

export interface VaultMember {
  id: number; user_id: number; can_write: boolean; added_at: string
}

export interface SharedCredential {
  id: number; vault_id: number; credential_id: number | null
  label: string; type: string; website_url: string | null
  username: string | null; email: string | null; note: string | null; tags: string | null
  added_by: number; added_at: string
}

export interface SharedCredentialDetail extends SharedCredential {
  password: string; secret_key: string | null
}

export interface SharedNote {
  id: number; vault_id: number; note_id: number | null
  title: string; type: string; tags: string | null
  added_by: number; added_at: string
}

export interface SharedNoteDetail extends SharedNote {
  content: string
}

// --- API Keys ---
export interface APIKey {
  id: number; name: string; key_prefix: string; scope: string
  is_active: boolean; last_used_at: string | null; expires_at: string | null; created_at: string
}

export interface APIKeyCreated extends APIKey {
  key: string
}

// --- Developer features ---
export interface DuplicateGroup {
  credential_ids: number[]; label_hints: string[]
}

// --- Documents ---
export interface Document {
  id: number; title: string; description: string | null
  document_type: string; file_name: string; file_size: number; mime_type: string
  tags: string | null; expires_at: string | null; is_favorite: boolean
  created_at: string; updated_at: string
}

export interface DocumentUpdate {
  title?: string; description?: string | null; document_type?: string
  tags?: string | null; expires_at?: string | null
}

export interface PaginatedDocuments {
  items: Document[]; total: number; page: number; limit: number; pages: number
}
