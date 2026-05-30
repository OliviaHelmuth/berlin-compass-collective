
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE public.location_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_location_posts_location ON public.location_posts(location_id, created_at DESC);

GRANT SELECT ON public.location_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_posts TO authenticated;
GRANT ALL ON public.location_posts TO service_role;

ALTER TABLE public.location_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts public read" ON public.location_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users insert own post" ON public.location_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own post" ON public.location_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own post" ON public.location_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_location_posts_updated_at
  BEFORE UPDATE ON public.location_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
