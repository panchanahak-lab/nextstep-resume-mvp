# AGENTS.md

## Cursor Cloud specific instructions

NextStep Resume is a single product in an **npm workspaces monorepo** (Node 22, npm 10). Dependencies for all workspaces install from the repo root with `npm install` (handled by the startup update script).

### Services and how to run them (dev mode)

| Service | Workspace | Dev command (from repo root) | URL / port |
|---------|-----------|------------------------------|------------|
| Dashboard app (core product) | `apps/app` | `npm run dev:app` | http://localhost:3001/app/ (basename `/app`, redirects to `/dashboard`) |
| Landing site | `apps/landing` | `npm run dev:landing` | http://localhost:3000/ |
| Document parser API (optional) | `apps/api` | `node apps/api/index.js` | http://localhost:3005 (`POST /parse`) |

- There is no root `index.html`/`vite.config.ts`, so the bare root `npm run dev` is not useful — always run `npm run dev:app` and/or `npm run dev:landing`.
- Cross-app links in dev (landing links into `/app/...`) require both servers running, since they listen on different ports.

### Lint / typecheck / build

- There is **no ESLint/Prettier config and no `lint` script**. The type check (`tsc`) is the de-facto lint and runs as part of each app's `build`.
- Build everything (typechecks + bundles both apps, merges into `dist/`): `npm run build`. Per-app: `npm run build:app`, `npm run build:landing`.

### Backend (Supabase + Gemini) — not configured by default

- Auth, history persistence, and all AI features rely on a **Supabase project** plus a server-side `GEMINI_API_KEY` (set via `supabase secrets set`, never in client env). Client needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`; the scanner additionally reads `VITE_GEMINI_API_KEY`.
- The app **degrades gracefully without these**: `getSupabaseClient()` returns `null` when env vars are missing (`packages/shared/src/auth.ts`), and the dashboard routes are **not auth-gated**, so the UI (including the local-autosave Resume Builder) loads and works without any backend. Use the Resume Builder (`/app/builder`) for a no-credentials smoke test — edits update the live preview and persist to `localStorage`.
- Vite loads `.env` from each app's own directory (the workspace running `vite`), not strictly the repo root.

### Known pre-existing issue (not an environment problem)

- The optional `apps/api` PDF path is broken with its pinned `pdf-parse` v2.4.5 (`pdfParse is not a function` — v2 changed its export). DOCX parsing via `mammoth` is unaffected. This is an app code issue, not a setup issue.
