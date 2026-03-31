"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type OddsFormat = "European" | "American" | "Fractional" | "Hong Kong" | "Indonesian" | "Malaysian";

const STORAGE_KEY = "waliet-odds-format";

const OddsFormatContext = createContext<{
  format: OddsFormat;
  setFormat: (f: OddsFormat) => void;
  formatOdds: (decimal: number | undefined | null) => string;
}>({
  format: "European",
  setFormat: () => {},
  formatOdds: (d) => d?.toFixed(2) ?? "—",
});

export function useOddsFormat() {
  return useContext(OddsFormatContext);
}

/** Convert decimal odds (e.g. 2.50) to the target format string */
function convert(decimal: number, format: OddsFormat): string {
  if (!decimal || decimal <= 0 || !isFinite(decimal)) return "—";

  switch (format) {
    case "European":
      // Standard decimal: 2.50
      return decimal.toFixed(2);

    case "American": {
      // Positive if >= 2.0, negative if < 2.0
      if (decimal >= 2) {
        return `+${Math.round((decimal - 1) * 100)}`;
      }
      return `${Math.round(-100 / (decimal - 1))}`;
    }

    case "Fractional": {
      // Convert to fraction: (decimal - 1) as a/b
      const dec = decimal - 1;
      if (dec <= 0) return "0/1";
      // Find a reasonable fraction
      const { num, den } = toFraction(dec);
      return `${num}/${den}`;
    }

    case "Hong Kong":
      // Same as decimal minus 1
      return (decimal - 1).toFixed(2);

    case "Indonesian": {
      // Same as HK for >= 2.0, negative reciprocal for < 2.0
      if (decimal >= 2) {
        return (decimal - 1).toFixed(2);
      }
      return (-1 / (decimal - 1)).toFixed(2);
    }

    case "Malaysian": {
      // Inverse of Indonesian
      if (decimal >= 2) {
        return (-1 / (decimal - 1)).toFixed(2);
      }
      return (decimal - 1).toFixed(2);
    }

    default:
      return decimal.toFixed(2);
  }
}

/** Approximate a decimal as a simple fraction */
function toFraction(dec: number): { num: number; den: number } {
  // Try common denominators used in fractional odds
  const denoms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 20, 25, 33, 40, 50, 100];
  let bestNum = Math.round(dec);
  let bestDen = 1;
  let bestErr = Math.abs(dec - bestNum);

  for (const d of denoms) {
    const n = Math.round(dec * d);
    const err = Math.abs(dec - n / d);
    if (err < bestErr) {
      bestErr = err;
      bestNum = n;
      bestDen = d;
    }
    if (err < 0.001) break;
  }

  // Simplify with GCD
  const g = gcd(bestNum, bestDen);
  return { num: bestNum / g, den: bestDen / g };
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export function OddsFormatProvider({ children }: { children: ReactNode }) {
  const [format, setFormatState] = useState<OddsFormat>("European");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["European", "American", "Fractional", "Hong Kong", "Indonesian", "Malaysian"].includes(stored)) {
        setFormatState(stored as OddsFormat);
      }
    } catch {}
  }, []);

  const setFormat = useCallback((f: OddsFormat) => {
    setFormatState(f);
    try { localStorage.setItem(STORAGE_KEY, f); } catch {}
  }, []);

  const formatOdds = useCallback(
    (decimal: number | undefined | null) => {
      if (decimal == null) return "—";
      return convert(decimal, format);
    },
    [format]
  );

  return (
    <OddsFormatContext.Provider value={{ format, setFormat, formatOdds }}>
      {children}
    </OddsFormatContext.Provider>
  );
}
