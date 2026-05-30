
-- Add submitter columns
ALTER TABLE public.events ADD COLUMN submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.opportunities ADD COLUMN submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "auth users submit events" ON public.events;
CREATE POLICY "auth users submit events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "auth submit opps" ON public.opportunities;
CREATE POLICY "auth submit opps" ON public.opportunities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
