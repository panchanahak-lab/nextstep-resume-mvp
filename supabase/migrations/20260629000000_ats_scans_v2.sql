-- Add scoring_version, scan_hash, projected_score columns to ats_scans
ALTER TABLE public.ats_scans
  ADD COLUMN IF NOT EXISTS scoring_version text NOT NULL DEFAULT 'ats_v1',
  ADD COLUMN IF NOT EXISTS scan_hash text,
  ADD COLUMN IF NOT EXISTS projected_score integer,
  ADD COLUMN IF NOT EXISTS issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parsed_resume_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS revised_resume_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS patches jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS manual_review_patches jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS inserted_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS manual_review_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS revision_id uuid REFERENCES public.resume_revisions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id text REFERENCES public.resume_templates(id);

-- Unique index: same user + same hash = same cached scan
CREATE UNIQUE INDEX IF NOT EXISTS ats_scans_user_hash_idx
  ON public.ats_scans(user_id, scan_hash)
  WHERE scan_hash IS NOT NULL;
