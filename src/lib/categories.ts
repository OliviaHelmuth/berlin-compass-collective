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
