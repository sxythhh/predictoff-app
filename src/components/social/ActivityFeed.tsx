"use client";

import { useState, useEffect, useCallback } from "react";

interface ActivityItem {
  id: string;
  type: string;
  metadata: Record<string, any>;
  createdAt: string;
  user: { id: string; walletAddress: string; displayName: string | null; avatar: string | null };
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  bet_placed: { icon: "ticket", color: "text-accent" },
  bet_won: { icon: "check", color: "text-green-400" },
  bet_lost: { icon: "x", color: "text-red-400" },
  comment: { icon: "chat", color: "text-blue-400" },
  follow: { icon: "user", color: "text-purple-400" },
  tournament_created: { icon: "trophy", color: "text-yellow-400" },
  tournament_joined: { icon: "trophy", color: "text-accent" },
  tournament_won: { icon: "trophy", color: "text-green-400" },
  tipster_setup: { icon: "star", color: "text-yellow-400" },
  pick_shared: { icon: "star", color: "text-accent" },
  pick_won: { icon: "check", color: "text-green-400" },
  pick_lost: { icon: "x", color: "text-red-400" },
  tipster_subscribed: { icon: "user", color: "text-accent" },
};

function ActivityIcon({ type }: { type: string }) {
  const config = ACTIVITY_ICONS[type] ?? { icon: "dot", color: "text-text-muted" };
  return (
    <div className={`w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center shrink-0 ${config.color}`}>
      {config.icon === "ticket" && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 4V12" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2"/></svg>
      )}
      {config.icon === "check" && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )}
      {config.icon === "x" && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5 5L11 11M11 5L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      )}
      {config.icon === "chat" && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4C2 3.44772 2.44772 3 3 3H13C13.5523 3 14 3.44772 14 4V10C14 10.5523 13.5523 11 13 11H5L2 14V4Z" stroke="currentColor" strokeWidth="1.3"/></svg>
      )}
      {config.icon === "user" && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 14C3 11.5 5.5 10 8 10C10.5 10 13 11.5 13 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      )}
      {config.icon === "star" && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
      )}
      {config.icon === "trophy" && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2H12V6C12 8.21 10.21 10 8 10C5.79 10 4 8.21 4 6V2Z" stroke="currentColor" strokeWidth="1.3"/><path d="M6 12H10M8 10V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M4 3H2V5C2 6.1 2.9 7 4 7" stroke="currentColor" strokeWidth="1.3"/><path d="M12 3H14V5C14 6.1 13.1 7 12 7" stroke="currentColor" strokeWidth="1.3"/></svg>
      )}
      {config.icon === "dot" && (
        <div className="w-2 h-2 rounded-full bg-current" />
      )}
    </div>
  );
}

function activityText(activity: ActivityItem): string {
  const m = activity.metadata;
  switch (activity.type) {
    case "bet_placed":
      return `Placed a bet on ${m.gameTitle ?? "a game"}`;
    case "bet_won":
      return `Won a bet on ${m.gameTitle ?? "a game"}`;
    case "bet_lost":
      return `Lost a bet on ${m.gameTitle ?? "a game"}`;
    case "comment":
      return `Commented on ${m.gameTitle ?? "a game"}`;
    case "follow":
      return `Started following ${m.targetName ?? "a user"}`;
    case "tournament_created":
      return `Created tournament "${m.title ?? m.tournamentTitle ?? ""}"`;
    case "tournament_joined":
      return `Joined tournament "${m.tournamentTitle ?? ""}"`;
    case "tournament_won":
      return `Finished #${m.rank ?? "?"} in "${m.tournamentTitle ?? ""}"${m.prizeAmount ? ` — won ${m.prizeAmount.toFixed(2)}` : ""}`;
    case "tipster_setup":
      return "Became a tipster";
    case "pick_shared":
      return `Shared a pick: ${m.selectionName ?? ""} on ${m.gameTitle ?? "a game"}`;
    case "pick_won":
      return `Pick hit! ${m.selectionName ?? ""} on ${m.gameTitle ?? ""}`;
    case "pick_lost":
      return `Pick missed: ${m.selectionName ?? ""} on ${m.gameTitle ?? ""}`;
    case "tipster_subscribed":
      return `Subscribed to a tipster`;
    default:
      return activity.type;
  }
}

export function ActivityFeed({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchActivities = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ userId, limit: "20" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/activity?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setActivities((prev) => cursor ? [...prev, ...data.activities] : data.activities);
    setNextCursor(data.nextCursor);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchActivities().finally(() => setLoading(false));
  }, [fetchActivities]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-bg-surface animate-pulse" />
            <div className="flex-1 h-4 rounded bg-bg-surface animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-bg-card rounded-xl border border-border-subtle p-8 text-center">
        <p className="text-text-muted text-[13px]">No recent activity</p>
        <p className="text-text-muted text-[11px] mt-1">Bets and comments will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bg-surface/50 transition-colors">
          <ActivityIcon type={activity.type} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-text-primary truncate">{activityText(activity)}</p>
            {activity.metadata.amount && (
              <p className="text-[11px] text-text-muted">
                {activity.metadata.amount} · {activity.metadata.odds ? `@ ${Number(activity.metadata.odds).toFixed(2)}` : ""}
              </p>
            )}
          </div>
          <span className="text-[11px] text-text-muted shrink-0">{timeAgo(activity.createdAt)}</span>
        </div>
      ))}
      {nextCursor && (
        <button
          onClick={() => fetchActivities(nextCursor)}
          className="h-8 rounded-lg bg-bg-surface text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors mt-1"
        >
          Load more
        </button>
      )}
    </div>
  );
}
