import { createServerFn } from "@tanstack/react-start";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME } from "./demo-persona";

/**
 * Ensure the shared Franziska demo account exists (creates with email confirmed
 * the first time) and reset her profile so the onboarding flow plays from scratch.
 * Returns the credentials the client uses to sign in.
 */
export const ensureDemoUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Look up the user (paginate to find by email; admin.getUserByEmail isn't in all versions)
  let userId: string | null = null;
  let page = 1;
  while (page < 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const found = data.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);
    if (found) {
      userId = found.id;
      break;
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: DEMO_NAME, full_name: DEMO_NAME, demo: true },
    });
    if (error || !data.user) throw new Error(error?.message ?? "Failed to create demo user");
    userId = data.user.id;
  } else {
    // Make sure the password is current
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
  }

  // Reset her profile so onboarding plays from scratch each time
  await supabaseAdmin
    .from("profiles")
    .update({
      onboarded_at: null,
      role: null,
      stage: null,
      industries: [],
      looking_for: [],
      background: [],
      arrival_status: null,
      residence_status: null,
      german_level: null,
      current_focus: [],
      interests: [],
      display_name: DEMO_NAME,
    })
    .eq("id", userId);

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
});
