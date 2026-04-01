"use client";

import { useState, useEffect } from "react";

// Single global 1-second ticker. Uses one setInterval but each
// subscriber updates via useState (non-blocking, React-scheduled).
let now = Date.now();
let intervalId: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<(t: number) => void>();

function ensureTicker() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    now = Date.now();
    // Notify subscribers — each one calls setState independently,
    // allowing React to batch and schedule at its own pace
    subscribers.forEach((cb) => cb(now));
  }, 1000);
}

function removeSub(cb: (t: number) => void) {
  subscribers.delete(cb);
  if (subscribers.size === 0 && intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** Returns the current timestamp, updated once per second via a single global interval. */
export function useTick(): number {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    subscribers.add(setTick);
    ensureTicker();
    return () => removeSub(setTick);
  }, []);

  return tick;
}
