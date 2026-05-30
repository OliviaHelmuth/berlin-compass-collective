
-- Phase 2: tagging foundation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS looking_for text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS background text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_locations_tags ON public.locations USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_opportunities_tags ON public.opportunities USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_profiles_industries ON public.profiles USING GIN (industries);
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for ON public.profiles USING GIN (looking_for);
