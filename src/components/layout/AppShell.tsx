"use client";

import { useState, useEffect } from "react";
import HeaderClient from "@/app/HeaderClient";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { PlayBetslip } from "@/components/waliet/PlayBetslip";
import { GameModalProvider, useGameModal, GameModal } from "@/components/waliet/GameModal";
import { sportIcons } from "@/components/waliet/sport-icons";

function MobileBetslipDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [startY, setStartY] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ transform: open ? `translateY(${dragY}px)` : undefined, maxHeight: "85vh" }}
        onTouchStart={(e) => setStartY(e.touches[0].clientY)}
        onTouchMove={(e) => { if (startY !== null) { const dy = e.touches[0].clientY - startY; if (dy > 0) setDragY(dy); } }}
        onTouchEnd={() => { if (dragY > 120) onClose(); setDragY(0); setStartY(null); }}
      >
        <div className="bg-bg-page rounded-t-2xl border-t border-border-primary flex flex-col" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center pt-3 pb-1 cursor-grab">
            <div className="w-10 h-1 rounded-full bg-border-subtle" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <PlayBetslip isMobileDrawer />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Shared app shell with header + sidebar + betslip.
 * Used by route layouts so pages like /tournaments, /picks, /tipsters
 * get the same navigation as the home page.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeSport, setActiveSport] = useState<string | null>(null);
  const [betslipOpen, setBetslipOpen] = useState(false);
  const gameModal = useGameModal();

  // Listen for betslip open events from anywhere
  useEffect(() => {
    const handler = () => setBetslipOpen(true);
    window.addEventListener("open-betslip", handler);
    return () => window.removeEventListener("open-betslip", handler);
  }, []);

  return (
    <GameModalProvider openGame={gameModal.open}>
      <SidebarProvider>
        <div className="min-h-screen bg-bg-page flex flex-col">
          <HeaderClient />
          <div className="flex flex-1">
            <div className="w-full flex h-[calc(100vh-56px)]">
              {/* Desktop: sidebar + content + betslip */}
              <div className="hidden lg:contents">
                <AppSidebar
                  activeSport={activeSport}
                  onSportClick={(slug) => { setActiveSport(slug); }}
                  sportIcons={sportIcons}
                />
              </div>

              {/* Main content area — fills center column */}
              <main className="flex-1 min-w-0 overflow-y-auto">
                {children}
              </main>

              {/* Desktop: betslip right column */}
              <div className="hidden lg:contents">
                <PlayBetslip />
              </div>
            </div>
          </div>

          {/* Mobile bottom padding for nav */}
          <div className="h-[60px] lg:hidden" />
        </div>

        {/* Mobile betslip drawer */}
        <MobileBetslipDrawer open={betslipOpen} onClose={() => setBetslipOpen(false)} />

        {/* Game modal */}
        {gameModal.isOpen && gameModal.gameId && (
          <GameModal gameId={gameModal.gameId} onClose={gameModal.close} />
        )}
      </SidebarProvider>
    </GameModalProvider>
  );
}
