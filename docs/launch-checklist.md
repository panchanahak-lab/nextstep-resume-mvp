# Launch Checklist

## Security

- [ ] Confirm `main` contains no direct Gemini frontend calls.
- [ ] Confirm `GEMINI_API_KEY` exists only in Supabase Secrets.
- [ ] Confirm `RAZORPAY_KEY_SECRET` exists only in Supabase Secrets.
- [ ] Confirm Vercel exposes only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [ ] Confirm RLS is enabled on all user data tables.
- [ ] Confirm at least one admin user is intentionally marked `is_admin = true`.
- [ ] Review Privacy Policy and Terms with final business/legal wording.

## Supabase

- [ ] Run all migrations.
- [ ] Deploy `ats-analysis`.
- [ ] Deploy `resume-enhancement`.
- [ ] Deploy `resume-summary`.
- [ ] Deploy `interview-feedback`.
- [ ] Deploy `live-interview-relay`.
- [ ] Deploy `razorpay-create-order`.
- [ ] Deploy `razorpay-verify-payment`.
- [ ] Deploy `admin-dashboard`.
- [ ] Confirm Auth email/password provider is enabled.

## Payments

- [ ] Add Razorpay test key ID and secret.
- [ ] Complete test purchase for Resume Pack.
- [ ] Complete test purchase for Interview Pack.
- [ ] Complete test purchase for Get Job Ready Pack.
- [ ] Confirm entitlements are created after signature verification.
- [ ] Add production webhook verification before real-money launch.

## Product QA

- [ ] ATS score returns out of 100.
- [ ] JD readiness score returns when job description is provided.
- [ ] ATS optimization plan appears.
- [ ] Resume builder autosaves.
- [ ] AI summary generation works.
- [ ] Existing resume upload returns improvement guidance.
- [ ] Interview warm-up appears.
- [ ] Multi-language interview setup works.
- [ ] Feedback includes strengths, weaknesses, line feedback, and suggested answers.
- [ ] Admin dashboard loads for admin user only.

## Deployment

- [ ] Merge via PR only.
- [ ] Verify Vercel production branch.
- [ ] Set Vercel environment variables.
- [ ] Run `npm run build` in CI or Vercel.
- [ ] Confirm no deployment uses `security-remediation` or `mvp-completion` unintentionally.
