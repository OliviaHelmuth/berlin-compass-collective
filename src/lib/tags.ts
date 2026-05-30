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
