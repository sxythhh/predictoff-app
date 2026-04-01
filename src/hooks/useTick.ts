"use client";

import { useSyncExternalStore } from "react";

// Single global 1-second ticker shared by ALL countdown components.
// Instead of 40+ setIntervals, there's exactly ONE.
let now = Date.now();
const listeners = new Set<() => void>();

let intervalId: ReturnType<typeof setInterval> | null = null;

function startTicker() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    now = Date.now();
    listeners.forEach((cb) => cb());
  }, 1000);
}

function stopTicker() {
  if (intervalId && listeners.size === 0) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  startTicker();
  return () => {
    listeners.delete(cb);
    stopTicker();
  };
}

function getSnapshot() {
  return now;
}

/** Returns the current timestamp, updated once per second via a single global interval. */
export function useTick(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
