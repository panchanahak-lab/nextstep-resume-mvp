ALTER TABLE public.ats_scans ADD COLUMN IF NOT EXISTS scoring_version text NOT NULL DEFAULT 'ats_v1';
ALTER TABLE public.ats_scans ADD COLUMN IF NOT EXISTS scan_hash text;
ALTER TABLE public.ats_scans ADD COLUMN IF NOT EXISTS projected_score integer;
CREATE UNIQUE INDEX IF NOT EXISTS ats_scans_user_hash_idx ON public.ats_scans(user_id, scan_hash) WHERE scan_hash IS NOT NULL;
