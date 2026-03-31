"use client";

import { useState, useCallback, type ReactNode } from "react";
import { CountryFlag, getCountryCode } from "@/components/sidebar/app-sidebar";

// Cache which URLs work directly (no proxy needed) vs need proxy
const urlStatusCache = new Map<string, "direct" | "proxy">();

/**
 * Team logo with fast loading:
 * - Uses proxy by default (Azuro CDN has CORS issues)
 * - Caches URL status so repeat renders don't retry
 * - Falls back to country flag or initials
 */
export function TeamLogo({
  src,
  name,
  className = "w-full h-full object-cover",
  fallback,
}: {
  src?: string | null;
  name: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const isCountry = !!getCountryCode(name);

  const [failed, setFailed] = useState(false);

  const onError = useCallback(() => {
    setFailed(true);
  }, []);

  // National teams get circle-flags
  if (isCountry) return <CountryFlag name={name} className={className} />;

  // No source — show fallback
  if (!src || failed) {
    return <>{fallback ?? <span className="text-[10px] font-bold text-text-muted">{name.slice(0, 2).toUpperCase()}</span>}</>;
  }

  // Go straight to proxy — avoids the failed direct request + CORS error
  const imgSrc = `/api/image-proxy?url=${encodeURIComponent(src)}`;

  return (
    <img
      src={imgSrc}
      alt={name}
      className={className}
      onError={onError}
      loading="lazy"
      decoding="async"
    />
  );
}
