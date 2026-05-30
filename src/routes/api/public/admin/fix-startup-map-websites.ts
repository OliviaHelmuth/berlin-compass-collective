import { createFileRoute } from "@tanstack/react-router";
import { fixStartupMapWebsites } from "@/lib/startup-map.server";

export const Route = createFileRoute("/api/public/admin/fix-startup-map-websites")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const result = await fixStartupMapWebsites();
          return new Response(JSON.stringify({ ok: true, ...result }, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
