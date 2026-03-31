"use client";

import { useState, useCallback, type ReactNode } from "react";
import { CountryFlag, getCountryCode } from "@/components/sidebar/app-sidebar";

/**
 * Team logo with automatic fallback chain:
 * 1. Direct URL from Azuro
 * 2. Proxy via /api/image-proxy (bypasses CORS/CDN issues)
 * 3. Country flag (for national teams / international games)
 * 4. Custom fallback (sport icon) or initials
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

  const [state, setState] = useState<"direct" | "proxy" | "fallback">(
    src && !isCountry ? "direct" : "fallback"
  );

  const onError = useCallback(() => {
    setState((prev) => {
      if (prev === "direct") return "proxy";
      return "fallback";
    });
  }, []);

  if (state === "fallback" || !src || isCountry) {
    // National teams get circle-flags
    if (isCountry) return <CountryFlag name={name} className={className} />;
    return <>{fallback ?? <span className="text-[10px] font-bold text-text-muted">{name.slice(0, 2)}</span>}</>;
  }

  const imgSrc =
    state === "proxy"
      ? `/api/image-proxy?url=${encodeURIComponent(src)}`
      : src;

  return (
    <img
      src={imgSrc}
      alt={name}
      className={className}
      onError={onError}
      loading="lazy"
    />
  );
}
