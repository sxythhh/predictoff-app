"use client";
import { useLive } from "@azuro-org/sdk";

export function LiveToggle() {
  const { isLive, changeLive } = useLive();

  return (
    <button
      onClick={() => changeLive(!isLive)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isLive
          ? "bg-red-500/10 text-red-400 border border-red-500/20"
          : "bg-border-subtle text-text-secondary border border-border-subtle hover:bg-bg-input"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isLive ? "bg-red-500 animate-pulse" : "bg-text-muted"}`} />
      <span className="text-[12px] font-semibold uppercase tracking-wider">
        Live
      </span>
    </button>
  );
}
