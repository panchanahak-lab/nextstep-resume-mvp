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

### Backend (Supabase + Gemini)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY` are injected as **shell env vars** (Cursor secrets). They are **not** auto-exposed to Vite — create a gitignored `apps/app/.env.local` mapping them. Vite loads `.env` from each app's own directory (the workspace running `vite`), not the repo root. Minimal working file:
  ```
  VITE_SUPABASE_URL=<from env>
  VITE_SUPABASE_ANON_KEY=<from env>
  VITE_GEMINI_API_KEY=<set to the GEMINI_API_KEY value>
  ```
- **AI ATS Scanner works end-to-end with just `VITE_GEMINI_API_KEY`.** `apps/app/src/services/aiScanner.ts` calls Gemini (`gemini-2.5-flash`) **directly from the browser** — no Supabase or Edge Function needed. Test at `/app/scanner`: paste resume + job description, click "Scan My Resume". (This contradicts the README's "never expose Gemini to the browser" security model, but it is the currently-wired path.)
- **Hosted Supabase auth/REST is NOT usable on the provided project URL**: every `/auth/v1/*` and `/rest/v1/*` request returns PostgREST `PGRST125 "Invalid path"`, so login/signup and history persistence (`scans`, `interviews`, `user_profiles`) fail. The `/functions/v1/*` Edge Functions endpoint does respond to OPTIONS. This is a backend project-config issue, not a setup problem.
- The app **degrades gracefully**: `getSupabaseClient()` returns `null` when env vars are missing (`packages/shared/src/auth.ts`), dashboard routes are **not auth-gated**, and `saveScanToHistory` silently no-ops without a logged-in user — so the Scanner and the local-autosave Resume Builder (`/app/builder`) both work without functioning auth.

### Known pre-existing issue (not an environment problem)

- The optional `apps/api` PDF path is broken with its pinned `pdf-parse` v2.4.5 (`pdfParse is not a function` — v2 changed its export). DOCX parsing via `mammoth` is unaffected. This is an app code issue, not a setup issue.
