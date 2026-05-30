
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS cover_url text;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_events_source_external
  ON public.events (source, external_id)
  WHERE source IS NOT NULL AND external_id IS NOT NULL;
