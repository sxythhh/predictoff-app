"use client";

import { useState, useCallback, type ReactNode } from "react";

/**
 * Team logo with automatic fallback chain:
 * 1. Direct URL from Azuro
 * 2. Proxy via /api/image-proxy (bypasses CORS/CDN issues)
 * 3. Custom fallback (sport icon) or initials
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
  const [state, setState] = useState<"direct" | "proxy" | "fallback">(
    src ? "direct" : "fallback"
  );

  const onError = useCallback(() => {
    setState((prev) => {
      if (prev === "direct") return "proxy";
      return "fallback";
    });
  }, []);

  if (state === "fallback" || !src) {
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
