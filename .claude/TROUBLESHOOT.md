# Troubleshooting Log — PUSAKA

> Record errors encountered during development, their root cause, and the fix.
> Format: `## [Phase] Error Title`

---

## Template

```
## [PhaseN.Checkpoint] Short Error Title

**Date:** YYYY-MM-DD
**Symptom:** What the error looked like / what failed.
**Root cause:** Why it happened.
**Fix:** What was done to resolve it.
**Files changed:** list of files
```

---

## [Phase 2.5] passlib + bcrypt>=4.0 incompatibility — 500 on /register

**Date:** 2026-03-06
**Symptom:** `POST /api/v1/auth/register` returned 500 Internal Server Error. Traceback showed:
  - `AttributeError: module 'bcrypt' has no attribute '__about__'`
  - `ValueError: password cannot be longer than 72 bytes, truncate manually`
  passlib tried to run a wrap-bug detection routine that used the new bcrypt API incorrectly.
**Root cause:** `passlib 1.7.4` is not compatible with `bcrypt>=4.0`. bcrypt 4.0 removed the
  `__about__` module that passlib used for version detection, causing the backend load to fail.
**Fix:** Removed `passlib[bcrypt]` from requirements. Updated `security.py` to call `bcrypt`
  directly (`bcrypt.hashpw` / `bcrypt.checkpw`). No behaviour change.
**Files changed:** `backend/requirements.txt`, `backend/app/core/security.py`

---

## [Phase 3.1] CredentialDetailResponse — `updated_at` missing after commit

**Date:** 2026-03-06
**Symptom:** `GET /api/v1/credentials/{id}` returned 500. Pydantic `ValidationError`:
  `updated_at Field required [type=missing]`.
**Root cause:** `credential.__dict__` used to build response dict. After `touch_last_accessed`
  issues `db.commit()`, SQLAlchemy expires all ORM attributes. `__dict__` then returns an
  incomplete dict (has `_sa_instance_state` but missing expired DB-generated columns like `updated_at`).
**Fix:** Added `await db.refresh(credential)` inside `touch_last_accessed`. Changed
  endpoint to build response via `CredentialResponse.model_validate(credential)` (which
  triggers per-field lazy-load via `from_attributes=True`) then construct
  `CredentialDetailResponse(**base.model_dump(), **decrypted)`. Same pattern applied to note detail.
**Files changed:** `backend/app/services/credential_service.py`,
  `backend/app/services/note_service.py`, `backend/app/api/v1/credentials.py`,
  `backend/app/api/v1/notes.py`

---

## [Phase 4.3] Next.js 16 renamed `middleware.ts` → `proxy.ts`; export must be `proxy`

**Date:** 2026-03-06
**Symptom:** Build warned `"middleware" file convention is deprecated`, then failed with
  `Proxy is missing expected function export name` after renaming the file.
**Root cause:** Next.js 16 renamed the routing middleware convention. Both the file name
  (`middleware.ts` → `proxy.ts`) AND the exported function name (`middleware` → `proxy`) must change.
**Fix:** Renamed file to `proxy.ts` and changed `export function middleware` → `export function proxy`.
  The `config` export and matcher remain unchanged.
**Files changed:** `frontend/proxy.ts` (was `middleware.ts`)

---

## [Phase 5.4] Zod `.default()` causes `Resolver` type mismatch with react-hook-form

**Date:** 2026-03-06
**Symptom:** TypeScript build error: `Type 'Resolver<{type?: string | undefined, ...}>' is not assignable to type 'Resolver<{type: string, ...}>'`
**Root cause:** `z.string().default('other')` makes the field optional in Zod's *input* type
  (Zod strips the `.default()` from the required input signature). react-hook-form's `zodResolver`
  therefore types the field as `string | undefined`, which conflicts with `useForm<FormValues>`
  where the same field is `string` (required).
**Fix:** Replace `z.string().default('...')` with `z.string().min(1)` and supply the default
  value inside `useForm({ defaultValues: { type: '...' } })` instead.
**Files changed:** `frontend/components/features/credential-form.tsx`,
  `frontend/components/features/note-form.tsx`

---

## [Phase 5.12] `useMutation` infers `Credential` but `mutationFn` can return `Note`

**Date:** 2026-03-06
**Symptom:** TypeScript error: `Type '() => Promise<Credential> | Promise<Note>' is not assignable to type 'MutationFunction<Credential, void>'`
**Root cause:** `FavoriteButton` handles both credentials and notes via a ternary in `mutationFn`.
  TypeScript infers `useMutation` from the first branch (`Credential`) but the union type
  `Promise<Credential> | Promise<Note>` is not assignable to `Promise<Credential>`.
**Fix:** Explicitly type the mutation generics as `useMutation<void, Error, void, { prev: unknown }>`.
  The return value is not used, so `void` is accurate. Wrap the ternary in `async () => { await ... }`
  to produce `Promise<void>`.
**Files changed:** `frontend/components/features/favorite-button.tsx`
