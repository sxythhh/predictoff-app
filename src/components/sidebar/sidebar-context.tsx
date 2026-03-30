"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";

export const SIDEBAR_COLLAPSED_WIDTH = 64;
export const SIDEBAR_EXPANDED_WIDTH = 240;

type SidebarContextType = {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  settingsOpen: boolean;
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
};

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  settingsOpen: false,
  setSettingsOpen: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore collapsed state from localStorage after hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") setCollapsed(true);
    } catch {
      // localStorage not available
    }
    setHydrated(true);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("sidebar-collapsed", String(collapsed));
    } catch {
      // localStorage not available
    }
  }, [collapsed, hydrated]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, settingsOpen, setSettingsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
