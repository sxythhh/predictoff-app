"use client";

import { useEffect } from "react";

const REF_STORAGE_KEY = "waliet-ref";

/**
 * Captures ?ref= query param from the URL and stores it in localStorage.
 * Uses window.location directly to avoid needing Suspense boundary.
 */
export function useCaptureReferral() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        localStorage.setItem(REF_STORAGE_KEY, ref);
      }
    } catch {}
  }, []);
}

export function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(REF_STORAGE_KEY);
  } catch {}
}

export async function applyReferral(): Promise<boolean> {
  const code = getStoredReferralCode();
  if (!code) return false;

  try {
    const res = await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      clearStoredReferralCode();
      return true;
    }

    // If already referred or invalid, clear the stored code
    const data = await res.json().catch(() => ({}));
    if (data.error === "Already referred" || data.error === "Cannot refer yourself") {
      clearStoredReferralCode();
    }
    return false;
  } catch {
    return false;
  }
}
