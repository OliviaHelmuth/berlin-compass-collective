ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS arrival_status text,
  ADD COLUMN IF NOT EXISTS residence_status text,
  ADD COLUMN IF NOT EXISTS german_level text,
  ADD COLUMN IF NOT EXISTS current_focus text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}'::text[];