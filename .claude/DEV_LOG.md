# PUSAKA Development Log

## Session: Phase A — Rebranding (2026-03-09)

### Changes Made

#### Brand Identity
- Renamed app from "Vault" to **PUSAKA** throughout all UI
- Tagline: "Simpan dengan Tenang. Jaga dengan Bangga."
- Target audience: Indonesian families, non-tech-savvy users

#### Color Palette
| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--primary` | `#2C1E1A` (Heritage Indigo) | `#D4AF37` (Keraton Gold) | Main brand |
| `--gold` | `#D4AF37` | `#D4AF37` | Accents, buttons |
| `--teal` | `#006064` | `#4DB6BC` | Success/confirmation |
| `--destructive` | `#BC6C25` (Terracotta) | `#E07B3A` | Warnings |
| `--background` | `#F9F7F2` (Soft Parchment) | `#1A1209` (Deep dark) | Page bg |
| `--sidebar` | `#2C1E1A` (Heritage Indigo) | `#130D06` | Sidebar bg |

#### Typography
- Added **Playfair Display** (serif) via `next/font/google` → `--font-playfair`
- Brand name "PUSAKA" uses `font-serif font-bold` in sidebar and headers
- Body copy stays on **Inter** for readability

#### i18n (Bilingual EN/ID)
- Custom `I18nProvider` + `useT()` hook in `lib/i18n.tsx`
- No external packages — pure React Context
- Language persisted in `localStorage` key `pusaka-lang`
- Language switcher in `Topbar` (top right of all dashboard pages)
- Translations cover: nav labels, dashboard strings, credentials, notes, settings

#### Sidebar
- Brand: "PUSAKA" in Playfair Display, Keraton Gold color
- Nav labels: dynamic, driven by `useT()` translations
- Dark Heritage Indigo background in light mode
- Collapsible (icon-only) with tooltips — implemented previous session

#### UI Accents
- **Batik Parang texture**: CSS crosshatch diagonal lines at ~3% gold opacity
  - Applied as `.batik-texture` class on dashboard background
  - Uses `::before` pseudo-element so content z-index is unaffected
- **Border radius**: `--radius: 0.75rem` (12px) — "Friendly and Near Us" feel

#### Dark Mode
- Full dark palette: warm dark tones (#1A1209, #221610)
- Keraton Gold becomes primary in dark mode (glows against dark bg)
- `ThemeProvider` from `next-themes` with system preference detection
- Theme toggle in Topbar (Light / Dark / System)

#### Settings Restructure (previous session, completed)
- `/profile` → redirects to `/settings/general`
- `/profile/api-keys` → redirects to `/settings/security`
- New settings layout with left-nav on desktop, horizontal tabs on mobile
- Sub-pages: General, Account, Security, Privacy, Billing, Organization

#### Backend
- Added `PATCH /api/v1/auth/me` endpoint for profile name updates
- Schema: `UpdateProfileRequest { first_name?, last_name? }`

---

## Pending

### Phase B — Documents (Dokumen Penting)
- New `Document` model with vault-key encryption
- File upload (multipart), encrypted storage in DB
- Document types: identity (KTP, paspor), certificate (ijazah), financial, medical, legal, insurance, travel, other
- API: POST, GET (list), GET/{id}, GET/{id}/download, PUT/{id}, DELETE/{id}, POST/{id}/favorite
- Frontend: `/documents` list, `/documents/new` upload, `/documents/[id]` detail
- Sidebar: new "Dokumen Penting" nav item

### Phase C — PUSAKA Waris (Future)
- Digital testament and legacy messages
- Beneficiary access management
- Scheduled delivery of messages

---

## Architecture Notes
- i18n is client-side only (localStorage persistence, React Context)
- Translations are in `lib/i18n.tsx` as typed TS objects — no JSON files
- Dark mode via `next-themes` — adds/removes `.dark` class on `<html>`
- Batik texture: CSS `::before` pseudo-element, pure CSS — no image files

## Session: Phase B — Dokumen Penting (2026-03-09)

### Overview
Added encrypted document storage (identity documents, certificates, etc.) as a first-class feature alongside credentials and secure notes.

### Backend Changes
- **`models/models.py`**: Added `DocumentType` enum, document activity actions to `ActivityAction`, `Document` model with encrypted `content_encrypted`, `documents` relationship to `User`
- **`core/security.py`**: Added `encrypt_bytes_for_user()` and `decrypt_bytes_for_user()` for binary file encryption via Fernet
- **`schemas/schemas.py`**: Added `DocumentResponse`, `DocumentUpdate`, `PaginatedDocuments`; added `total_documents` to `DashboardResponse`
- **`services/document_service.py`**: Created — list, get, create, update, delete, toggle_favorite, decrypt_document
- **`api/v1/documents.py`**: Created — 7 endpoints (GET list, POST upload, GET/{id}, GET/{id}/download, PUT/{id}, DELETE/{id}, POST/{id}/favorite), 25MB limit
- **`services/dashboard_service.py`**: Added Document import and total_docs count
- **`main.py`**: Registered documents router at `/api/v1/documents`
- **`alembic/versions/f7a3b2c9e1d4_add_documents_table.py`**: Idempotent migration creating `documents` table

### Frontend Changes
- **`lib/api.ts`**: Fixed FormData Content-Type handling; added `Document`, `DocumentUpdate`, `PaginatedDocuments` types; added `documentsApi`; added `total_documents` to `DashboardStats`
- **`lib/utils.ts`**: Added `formatBytes()` helper
- **`lib/i18n.tsx`**: Added `documents` translation namespace (EN/ID) + `nav.documents` + `dashboard.totalDocuments`
- **`components/layout/sidebar.tsx`**: Added Documents nav item (FolderArchive icon)
- **`components/features/favorite-button.tsx`**: Added `kind="document"` support
- **`app/(dashboard)/documents/page.tsx`**: List with search, type filter, favorites, pagination
- **`app/(dashboard)/documents/new/page.tsx`**: Drag & drop upload form
- **`app/(dashboard)/documents/[id]/page.tsx`**: Detail view with download link and delete confirm
- **`app/(dashboard)/documents/[id]/edit/page.tsx`**: Edit metadata form
- **`app/(dashboard)/dashboard/page.tsx`**: Added Documents stat card (3-column grid)

### Architecture Notes
- Files stored encrypted (Fernet base64) in `documents.content_encrypted` column — no filesystem needed
- File metadata (name, size, MIME) stored unencrypted for display without vault key
- Download uses `credentials: 'include'` cookie auth — direct navigation works via `<a href={downloadUrl}>`
- 25 MB file limit enforced both in backend (HTTP 413) and frontend (client-side check before upload)
