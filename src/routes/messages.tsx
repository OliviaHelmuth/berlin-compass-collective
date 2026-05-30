import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listConversations,
  getThread,
  sendMessage,
  searchUsers,
  type Conversation,
} from "@/lib/messages.functions";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [{ title: "Messages — Kiez Founders Berlin" }],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: "/messages" } });
    }
  },
  component: MessagesPage,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function MessagesPage() {
  const [me, setMe] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const listConvs = useServerFn(listConversations);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ["dm-conversations"],
    queryFn: () => listConvs(),
  });

  // Realtime: refresh on any incoming message
  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel("dm-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const row = payload.new as { sender_id: string; recipient_id: string };
          if (row.sender_id === me || row.recipient_id === me) {
            qc.invalidateQueries({ queryKey: ["dm-conversations"] });
            const other = row.sender_id === me ? row.recipient_id : row.sender_id;
            qc.invalidateQueries({ queryKey: ["dm-thread", other] });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, qc]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-180px)] min-h-[500px]">
        {/* Sidebar */}
        <aside className={`${partnerId ? "hidden md:flex" : "flex"} flex-col rounded-2xl border-2 border-outline bg-surface-container overflow-hidden`}>
          <div className="p-3 border-b-2 border-outline flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-lg">Messages</h2>
            <button
              onClick={() => setShowNew(true)}
              className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center border-2 border-outline shadow-brutal-sm"
              aria-label="New message"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit_square</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                No conversations yet. Tap the pencil to start one.
              </div>
            ) : (
              conversations.map((c) => (
                <ConversationItem
                  key={c.partner_id}
                  c={c}
                  active={partnerId === c.partner_id}
                  onClick={() => setPartnerId(c.partner_id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className={`${partnerId ? "flex" : "hidden md:flex"} flex-col rounded-2xl border-2 border-outline bg-surface overflow-hidden`}>
          {partnerId && me ? (
            <Thread me={me} partnerId={partnerId} onBack={() => setPartnerId(null)} />
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-8 text-center">
              Select a conversation, or start a new one.
            </div>
          )}
        </section>
      </div>

      {showNew && (
        <NewMessageModal
          onClose={() => setShowNew(false)}
          onPick={(id) => {
            setPartnerId(id);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function ConversationItem({ c, active, onClick }: { c: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 p-3 border-b border-outline/20 hover:bg-surface ${active ? "bg-surface" : ""}`}
    >
      <div className="size-10 rounded-full bg-primary-container grid place-items-center font-display text-xs font-bold text-on-primary-container shrink-0">
        {(c.partner_name ?? "?").slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{c.partner_name ?? "Unknown"}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {new Date(c.last_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate">
            {c.last_from_me ? "You: " : ""}
            {c.last_body}
          </p>
          {c.unread > 0 && (
            <span className="ml-2 px-1.5 min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground text-[10px] font-bold grid place-items-center">
              {c.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Thread({ me, partnerId, onBack }: { me: string; partnerId: string; onBack: () => void }) {
  const fetchThread = useServerFn(getThread);
  const sendFn = useServerFn(sendMessage);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dm-thread", partnerId],
    queryFn: () => fetchThread({ data: { partnerId } }),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [data?.messages.length]);

  const messages = data?.messages ?? [];
  const partner = data?.partner;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody("");
    try {
      await sendFn({ data: { recipientId: partnerId, body: trimmed } });
      qc.invalidateQueries({ queryKey: ["dm-thread", partnerId] });
      qc.invalidateQueries({ queryKey: ["dm-conversations"] });
    } catch (err) {
      setBody(trimmed);
      console.error(err);
    }
  };

  return (
    <>
      <header className="flex items-center gap-3 p-3 border-b-2 border-outline">
        <button onClick={onBack} className="md:hidden size-9 rounded-full bg-surface-container grid place-items-center" aria-label="Back">
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <div className="size-10 rounded-full bg-primary-container grid place-items-center font-display text-xs font-bold text-on-primary-container">
          {(partner?.display_name ?? "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{partner?.display_name ?? "Unknown"}</div>
          {(partner?.role || partner?.district) && (
            <div className="text-[11px] text-muted-foreground truncate">
              {[partner?.role, partner?.district].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-container/30">
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center pt-10">Say hi — start the conversation.</div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl border-2 border-outline text-sm whitespace-pre-wrap ${
                  mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-surface rounded-bl-sm"
                }`}
              >
                {m.body}
                <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="p-3 border-t-2 border-outline flex items-end gap-2 bg-surface">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="flex-1 resize-none bg-surface-container rounded-2xl px-4 py-2 text-sm outline-none border-2 border-outline/20 focus:border-outline max-h-32"
        />
        <button
          type="submit"
          disabled={!body.trim()}
          className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center border-2 border-outline shadow-brutal-sm disabled:opacity-40"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>send</span>
        </button>
      </form>
    </>
  );
}

function NewMessageModal({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const search = useServerFn(searchUsers);
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 200);
  const { data: users = [] } = useQuery({
    queryKey: ["dm-user-search", debounced],
    queryFn: () => search({ data: { q: debounced } }),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl border-2 border-outline shadow-brutal w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b-2 border-outline">
          <h3 className="font-display font-bold text-lg mb-3">New message</h3>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            className="w-full bg-surface-container rounded-full px-4 h-10 text-sm outline-none border-2 border-outline/20 focus:border-outline"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No people yet.</div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => onPick(u.id)}
                className="w-full text-left flex items-center gap-3 p-3 hover:bg-surface-container border-b border-outline/20"
              >
                <div className="size-10 rounded-full bg-primary-container grid place-items-center font-display text-xs font-bold text-on-primary-container">
                  {(u.display_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{u.display_name ?? "Unknown"}</div>
                  {(u.role || u.district) && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {[u.role, u.district].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return useMemo(() => v, [v]);
}
