<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NextStep Resume

AI-powered resume, ATS, job tracking, and interview preparation MVP.

## Security Model

Gemini API credentials must never be exposed to the browser. AI features call authenticated Supabase Edge Functions, and those functions read `GEMINI_API_KEY` from Supabase Secrets.

## Run Locally

**Prerequisites:** Node.js and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set:

   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-supabase-anon-key
   ```

3. Store the Gemini key server-side only:

   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_key
   ```

4. Apply migrations and deploy functions:

   ```bash
   supabase db push
   supabase functions deploy ai-router
   supabase functions deploy ats-analysis
   supabase functions deploy resume-enhancement
   supabase functions deploy resume-summary
   supabase functions deploy interview-feedback
   supabase functions deploy live-interview-relay
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

## Verification

```bash
npx tsc --noEmit
npm run build
rg "@google/genai|GoogleGenAI|process\.env\.API_KEY|process\.env\.GEMINI_API_KEY" src vite.config.ts package.json
```
