export function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap transition-colors border-2 ${
        active
          ? "bg-primary-container text-on-primary-container border-primary"
          : "bg-surface text-foreground border-outline/20 hover:border-outline/40"
      }`}
    >
      {active && <span className="material-symbols-rounded" style={{ fontSize: 16 }}>check</span>}
      {icon && !active && <span className="material-symbols-rounded opacity-70" style={{ fontSize: 16 }}>{icon}</span>}
      {label}
    </button>
  );
}
