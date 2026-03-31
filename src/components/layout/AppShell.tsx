"use client";

import { useState, useCallback } from "react";
import HeaderClient from "@/app/HeaderClient";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { PlayBetslip } from "@/components/waliet/PlayBetslip";
import { GameModalProvider, useGameModal, GameModal } from "@/components/waliet/GameModal";
import { sportIcons } from "@/components/waliet/sport-icons";

/**
 * Shared app shell with header + sidebar + betslip.
 * Used by route layouts so pages like /tournaments, /picks, /tipsters
 * get the same navigation as the home page.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeSport, setActiveSport] = useState<string | null>(null);
  const gameModal = useGameModal();

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

        {/* Game modal */}
        {gameModal.isOpen && gameModal.gameId && (
          <GameModal gameId={gameModal.gameId} onClose={gameModal.close} />
        )}
      </SidebarProvider>
    </GameModalProvider>
  );
}
