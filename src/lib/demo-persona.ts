// Franziska's persona for the /demo flow.
// Values MUST match catalog strings in src/lib/tags.ts.

export const FRANZISKA_PREFILL = {
  role: "Founder",
  arrival_status: "Already in Berlin",
  residence_status: "EU / Swiss citizen",
  german_level: "Native",
  stage: "Building MVP",
  current_focus: ["Build a startup", "Find co-founders", "Raise funding"],
  industries: ["Clean Energy", "Circular Economy"],
  interests: ["Networking", "Pitch", "Climate", "Demo Day"],
  looking_for: ["Co-founder", "Funding", "Mentors"],
  background: ["Product", "Business"],
};

export const FRANZISKA_MATCH_QUERY =
  "Ich bin Climate-Tech-Founderin in Berlin und baue gerade einen MVP für zirkuläre Verpackungen. Ich suche eine technische Mitgründerin, erste Angels und eine Klima-Community.";

export const DEMO_EMAIL = "franziska.demo@kiezfounders.berlin";
export const DEMO_PASSWORD = "franziska-demo-2026!";
export const DEMO_NAME = "Franziska Bauer";

// Demo onboarding is intentionally short for the demo video — only these
// six question IDs are asked (matches the IDs in src/routes/onboarding.tsx).
export const DEMO_STEP_IDS = [
  "role",
  "stage",
  "focus",
  "industries",
  "interests",
  "looking",
] as const;

export const DEMO_FLAG_KEY = "kf:demo";
export const DEMO_MATCH_KEY = "kf:demo:match";
