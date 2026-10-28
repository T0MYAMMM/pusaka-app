# PUSAKA Style Guide — "Nila & Kuningan"

The 2026-10 redesign evolves *Keraton Modern* (heritage indigo + keraton gold +
batik texture) into a crisper system. **Nila** is the indigo of hand-dyed batik
tulis; **kuningan** is the brass of an heirloom chest's fittings. Indigo carries
the interface; brass is rationed to the few things that deserve a glint.

Built with two skills vendored in `.claude/skills/`:
`frontend-design` (anthropics/skills) for direction and `web-design-guidelines`
(vercel-labs/agent-skills) for the review pass.

## 1. Color tokens (`frontend/app/globals.css`)

| Token | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `--background` | `#F4F5FA` cool paper | `#0D1022` indigo night | Page |
| `--card` | `#FFFFFF` | `#141831` | Panels, rows |
| `--primary` | `#2B3478` nila | `#AEB8FF` | Buttons, links, active states |
| `--brass` | `#B07F24` | `#D9AE55` | Favorites, brand mark, vault-health numbers **only** |
| `--success` / `--warning` / `--destructive` / `--info` | jade / amber / sirih red / sky | lifted variants | Status, with `-soft` tint pairs |
| `--sidebar` | `#161B3D` | `#090B19` | App rail, auth panel |
| `--chart-1` | `#4553B8` | `#7D8AF0` | Single-hue bar lists (validated with the dataviz script) |

Rules: use semantic classes (`bg-card`, `text-muted-foreground`, `bg-brass-soft`…),
never raw Tailwind palette colors. The background is deliberately *not* cream.

## 2. Typography
* **Plus Jakarta Sans** (Tokotype, Jakarta) for everything, 400–800. Headlines
  use weight 700–800 with negative tracking (`-0.02em` to `-0.04em`).
* **JetBrains Mono** only for secrets, keys, file names and code — where l/1 and
  O/0 must be unambiguous. Revealed passwords tint digits (info) and symbols (brass).
* Sentence case. No ALL-CAPS labels, no `→` on buttons.

## 3. Shape & surface
* Radius hierarchy: chips 6px (`rounded-md`) · controls 8–10px (`rounded-lg`) ·
  panels 14px (`rounded-xl`) · hero 18–28px.
* Panels are border-only; shadows are reserved for overlays (dialogs, menus, toasts).
* Controls are 40px tall (`h-10`); compact buttons 32px.

## 4. Kawung motif (Kearifan Lokal)
* The brand mark is a single kawung flower: four brass petals around a seed on an
  indigo tile (`components/brand/logo.tsx`, `public/icon.svg`).
* `.kawung` draws the repeating motif as a CSS mask so it follows the theme. Set
  `[--kawung-color:…]` and `[--kawung-size:…]`; `.kawung-fade-b` / `.kawung-fade-r`
  fade it towards an edge. Used on the sidebar, the vault-health panel, the auth
  panel and landing bands — never behind body text.
* The one orchestrated motion: petals open once (`.petal-open`) on the landing
  hero and auth panel. Everything else moves only in response to the user.

## 5. Building blocks (`frontend/components/shared/`)
`PageContainer` / `PageHeader` / `Panel`, `ItemTile` (category tone + icon),
`EmptyState`, `SearchField` / `FilterChips` / `FavoritesToggle`, `StatusPill` /
`EnvBadge` / `ExpiryBadge` / `TagList`, `FieldRow` / `RevealButton`, `SecretText`,
`Field` / `PasswordInput` / `StrengthMeter` / `FormActions`, `Pagination`, `Kbd` / `MetaList`.
Category meta (label, icon, tone) lives in `frontend/lib/item-meta.ts`.

## 6. Patterns
* **Lists** are rows, not card grids (documents excepted): stretched-link row,
  actions as separate buttons, skeleton rows, filtered vs first-run empty states,
  filters in the URL.
* **Detail pages**: header with back link + tile, fields column + "Details" aside.
* **Forms**: sections as Panels, inline errors announced via `aria-describedby`,
  sticky `FormActions`, unsaved-changes warning, password generator.
* **⌘K** command palette searches items and jumps anywhere.

## 7. Voice
Plain, warm and specific — pass the "Uncle/Aunt test" from `BRAND.md`. Buttons say
what happens ("Save credential"), errors say how to fix it, empty states invite
the first step. Security copy states only what the code does (no "zero-knowledge").
