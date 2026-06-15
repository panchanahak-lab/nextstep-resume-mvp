# Deployment Guide

This guide is for deployment preparation only. No deployment was performed during MVP completion.

## Frontend

Required Vercel environment variables:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-supabase-anon-key
```

Build command:

```bash
npm install
npm run build
```

Output directory:

```bash
dist
```

## Supabase Migrations

Apply migrations:

```bash
supabase db push
```

Migrations included:

- `20260611160000_ai_security_remediation.sql`
- `20260615120000_mvp_completion_schema.sql`

## Supabase Secrets

Set server-side secrets:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_test_secret
```

Do not place these values in Vercel client environment variables.

## Edge Functions

Deploy functions:

```bash
supabase functions deploy ai-router
supabase functions deploy ats-analysis
supabase functions deploy resume-enhancement
supabase functions deploy resume-summary
supabase functions deploy interview-feedback
supabase functions deploy live-interview-relay
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
supabase functions deploy admin-dashboard
```

## Admin Setup

After a user signs up, mark the approved admin user:

```sql
insert into public.user_profiles (user_id, is_admin)
values ('USER_UUID_HERE', true)
on conflict (user_id)
do update set is_admin = true;
```

## Razorpay Test Cards

Use Razorpay test mode only for MVP validation. Production launch requires:

- production Razorpay keys,
- webhook endpoint and signature validation,
- refund/cancellation policy,
- final business/legal copy.

## Known Deployment Warnings

- `index.html` references `/index.css`; the file does not exist at build time. Remove or add the stylesheet before launch.
- Main JS bundle is near/over 500 KB. Code-split admin and interview modules if performance becomes an issue.
