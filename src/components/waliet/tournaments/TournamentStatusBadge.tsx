"use client";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-text-muted", bg: "bg-bg-surface" },
  open: { label: "Open", color: "text-blue-400", bg: "bg-blue-500/10" },
  active: { label: "Live", color: "text-green-400", bg: "bg-green-500/10" },
  scoring: { label: "Scoring", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  completed: { label: "Completed", color: "text-text-secondary", bg: "bg-bg-surface" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10" },
};

export function TournamentStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
}
