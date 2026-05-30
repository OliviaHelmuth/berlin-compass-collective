// Central tag catalogue for onboarding + recommendations.

export const ROLES = [
  "Founder",
  "Aspiring Founder",
  "Researcher",
  "Student",
  "Engineer",
  "Investor",
  "Operator",
  "Corporate Innovator",
  "Mentor",
] as const;

export const STAGES = [
  "Exploring Ideas",
  "Building MVP",
  "Early Customers",
  "Raising Funding",
  "Scaling",
  "Looking for New Opportunities",
] as const;

export const INDUSTRY_GROUPS: { group: string; tags: string[] }[] = [
  { group: "Deep Tech", tags: ["AI", "Robotics", "Quantum", "Semiconductors", "Space"] },
  { group: "Climate & Sustainability", tags: ["Clean Energy", "Carbon Removal", "Circular Economy", "Sustainable Mobility"] },
  { group: "Health & Bio", tags: ["Digital Health", "Biotech", "Neuroscience", "Medical Devices"] },
  { group: "Software", tags: ["SaaS", "Fintech", "Cybersecurity", "Developer Tools"] },
  { group: "Industry", tags: ["Manufacturing", "Logistics", "Supply Chain", "Industry 4.0"] },
  { group: "Society", tags: ["Education", "GovTech", "Civic Tech", "Social Impact"] },
];

export const ALL_INDUSTRIES = INDUSTRY_GROUPS.flatMap((g) => g.tags);

export const LOOKING_FOR = [
  "Co-founder",
  "Funding",
  "Customers",
  "Talent",
  "Mentors",
  "Research Partners",
  "University Collaborations",
  "Office Space",
  "Community",
  "Legal Support",
  "Tax Support",
] as const;

export const BACKGROUNDS = [
  "Software Engineering",
  "Product",
  "Design",
  "Business",
  "Marketing",
  "Sales",
  "Finance",
  "Science",
  "Academia",
  "Operations",
  "Legal",
] as const;

// Welcome Berlin–inspired journey questions
export const ARRIVAL_STATUS = [
  "Already in Berlin",
  "Moving soon",
  "Just exploring",
] as const;

export const RESIDENCE_STATUS = [
  "EU / Swiss citizen",
  "Non-EU with Visa / permit",
  "Need a visa",
  "German citizen",
] as const;

export const GERMAN_LEVEL = [
  "None",
  "A1–A2 (basic)",
  "B1–B2 (intermediate)",
  "C1–C2 (advanced)",
  "Native",
] as const;

// Things they want to tackle now (Welcome Berlin "current focus" + founder needs)
export const CURRENT_FOCUS = [
  "Build a startup",
  "Find co-founders",
  "Raise funding",
  "Find a job",
  "Freelancing",
  "Housing & Anmeldung",
  "Visa & residence",
  "Health insurance & bank",
  "Language & integration",
  "Education & upskilling",
] as const;

// Content interests — must mirror tags used on events & opportunities
export const INTERESTS = [
  "Networking",
  "Workshop",
  "Pitch",
  "Funding",
  "Founder",
  "AI",
  "Hackathon",
  "Demo Day",
  "Mentorship",
  "Conference",
  "Meetup",
  "Investor",
  "Hiring",
  "Community",
  "Climate",
  "Web3",
  "Health",
] as const;

