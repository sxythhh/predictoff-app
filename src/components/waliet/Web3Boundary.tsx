"use client";

import { type ReactNode, useState, useEffect, useCallback, lazy, Suspense, createContext, useContext } from "react";

const WalietProviders = lazy(() =>
  import("./WalietProviders").then((m) => ({ default: m.WalietProviders }))
);

// Context to signal when the app has real data and is ready to show
const SplashContext = createContext<{ removeSplash: () => void }>({ removeSplash: () => {} });

export function useSplashReady() {
  return useContext(SplashContext);
}

function doRemoveSplash() {
  const el = document.getElementById("splash");
  if (!el) return;
  el.style.transition = "opacity 0.25s ease-out";
  el.style.opacity = "0";
  setTimeout(() => el.remove(), 250);
}

export function Web3Boundary({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [splashRemoved, setSplashRemoved] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Safety net: remove splash after 6s max even if data never arrives
    const timeout = setTimeout(() => {
      doRemoveSplash();
      setSplashRemoved(true);
    }, 6000);

    return () => clearTimeout(timeout);
  }, []);

  const removeSplash = useCallback(() => {
    if (splashRemoved) return;
    setSplashRemoved(true);
    doRemoveSplash();
  }, [splashRemoved]);

  if (!mounted) return null;

  return (
    <SplashContext.Provider value={{ removeSplash }}>
      <Suspense fallback={null}>
        <WalietProviders>{children}</WalietProviders>
      </Suspense>
    </SplashContext.Provider>
  );
}
