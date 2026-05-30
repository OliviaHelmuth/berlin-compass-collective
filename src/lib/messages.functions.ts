import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Conversation = {
  partner_id: string;
  partner_name: string | null;
  partner_avatar: string | null;
  last_body: string;
  last_at: string;
  last_from_me: boolean;
  unread: number;
};

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Conversation[]> => {
    const { supabase, userId } = context;
    const { data: msgs, error } = await supabase
      .from("direct_messages")
      .select("id, sender_id, recipient_id, body, created_at, read_at")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const byPartner = new Map<string, Conversation>();
    for (const m of msgs ?? []) {
      const partnerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      const existing = byPartner.get(partnerId);
      if (!existing) {
        byPartner.set(partnerId, {
          partner_id: partnerId,
          partner_name: null,
          partner_avatar: null,
          last_body: m.body,
          last_at: m.created_at,
          last_from_me: m.sender_id === userId,
          unread: m.recipient_id === userId && !m.read_at ? 1 : 0,
        });
      } else if (m.recipient_id === userId && !m.read_at) {
        existing.unread += 1;
      }
    }

    const ids = [...byPartner.keys()];
    if (ids.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids);
      for (const p of profs ?? []) {
        const c = byPartner.get(p.id);
        if (c) {
          c.partner_name = p.display_name;
          c.partner_avatar = p.avatar_url;
        }
      }
    }

    return [...byPartner.values()].sort((a, b) => (a.last_at < b.last_at ? 1 : -1));
  });

export const getThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ partnerId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: msgs, error } = await supabase
      .from("direct_messages")
      .select("id, sender_id, recipient_id, body, created_at, read_at")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${data.partnerId}),and(sender_id.eq.${data.partnerId},recipient_id.eq.${userId})`,
      )
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);

    const { data: partner } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, role, district")
      .eq("id", data.partnerId)
      .maybeSingle();

    // Mark unread incoming as read
    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .eq("sender_id", data.partnerId)
      .is("read_at", null);

    return { messages: msgs ?? [], partner, me: userId };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        recipientId: z.string().uuid(),
        body: z.string().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (userId === data.recipientId) throw new Error("Cannot message yourself");
    const { data: row, error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: userId, recipient_id: data.recipientId, body: data.body })
      .select("id, sender_id, recipient_id, body, created_at, read_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ q: z.string().max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const q = data.q.trim();
    let query = supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, role, district")
      .neq("id", userId)
      .order("display_name")
      .limit(20);
    if (q.length > 0) query = query.ilike("display_name", `%${q}%`);
    const { data: profs, error } = await query;
    if (error) throw new Error(error.message);
    return profs ?? [];
  });
