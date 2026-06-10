import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureDemoUser } from "@/lib/demo.functions";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo — Kiez Founders Berlin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  // Provision Franziska in the background, then drop the visitor straight on
  // the (prefilled) login screen. No intermediate loading UI.
  loader: async () => {
    try {
      await ensureDemoUser();
    } catch {
      // If provisioning fails we still send them to the login screen; the
      // sign-in button will retry there.
    }
    throw redirect({ to: "/login", search: { demo: "franziska" } as never });
  },
  component: () => null,
});
