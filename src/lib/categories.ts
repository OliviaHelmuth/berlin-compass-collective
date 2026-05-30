export type LocationCategory =
  | "coworking"
  | "accelerator"
  | "incubator"
  | "university"
  | "vc"
  | "hub"
  | "service";

export const CATEGORIES: { id: LocationCategory; label: string; icon: string }[] = [
  { id: "coworking", label: "Co-working", icon: "groups" },
  { id: "accelerator", label: "Accelerators", icon: "rocket_launch" },
  { id: "incubator", label: "Incubators", icon: "egg" },
  { id: "vc", label: "VCs", icon: "payments" },
  { id: "university", label: "Universities", icon: "school" },
  { id: "hub", label: "Hubs", icon: "hub" },
  { id: "service", label: "Services", icon: "handyman" },
];

export const CATEGORY_LABEL: Record<LocationCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<LocationCategory, string>;

export type TopicFilter = {
  id: string;
  label: string;
  icon: string;
  tags: string[];
};

export const TOPIC_FILTERS: TopicFilter[] = [
  { id: "coaching", label: "Coaching & mentoring", icon: "psychology", tags: ["coaching", "consulting"] },
  { id: "legal", label: "Legal", icon: "gavel", tags: ["legal", "paperwork", "citizenship"] },
  { id: "tax", label: "Tax & accounting", icon: "calculate", tags: ["tax", "accounting", "finance"] },
  { id: "immigration", label: "Visa & immigration", icon: "flight_land", tags: ["immigration", "visa", "anmeldung"] },
  { id: "housing", label: "Housing & relocation", icon: "home_work", tags: ["housing", "real estate", "relocation", "moving"] },
  { id: "language", label: "German & language", icon: "translate", tags: ["language", "translation"] },
  { id: "insurance", label: "Insurance & banking", icon: "shield", tags: ["insurance", "banking"] },
  { id: "jobs", label: "Jobs & talent", icon: "work", tags: ["job search"] },
];

