-- 1) Realtime authorization: lock down realtime.messages so authenticated
-- users cannot subscribe to arbitrary Broadcast/Presence topics and receive
-- private DMs. The app uses postgres_changes only, which respects RLS on
-- public.direct_messages.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny broadcast and presence by default" ON realtime.messages;
DROP POLICY IF EXISTS "deny broadcast and presence writes by default" ON realtime.messages;

CREATE POLICY "deny broadcast and presence by default"
ON realtime.messages
FOR SELECT
TO authenticated
USING (false);

CREATE POLICY "deny broadcast and presence writes by default"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 2) user_roles privilege escalation hardening: explicit admin-only writes.
DROP POLICY IF EXISTS "admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins delete roles" ON public.user_roles;

CREATE POLICY "admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));