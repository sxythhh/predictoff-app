"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@azuro-org/sdk";
import { ModalHeader } from "./ModalHeader";
import { ModalStats } from "./ModalStats";
import { ModalMarkets } from "./ModalMarkets";
import { ModalCarousel } from "./ModalCarousel";
import { useTeamGradient } from "./useTeamGradient";
import { GameComments } from "@/components/social/GameComments";

// Re-export context/hooks from original file
export { GameModalProvider, useGameModal, useOpenGame } from "../GameModal";

/* ── Desktop Modal ── */

const DesktopModal = memo(function DesktopModal({
  gameId,
  onClose,
}: {
  gameId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: game, isLoading } = useGame({ gameId });
  const { gradient } = useTeamGradient(game ?? undefined);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimating(false));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleExpand = () => {
    onClose();
    router.push(`/game/${gameId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.85) 100%)",
          opacity: animating ? 0 : 1,
          transition: "opacity 300ms ease",
        }}
        onClick={onClose}
      />

      {/* Modal — full gradient background */}
      <div
        className="relative w-full max-w-[720px] max-h-[85vh] mx-4 rounded-2xl overflow-hidden shadow-2xl border border-white/[0.06]"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "scale(0.95) translateY(10px)" : "none",
          transition: "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)",
          background: gradient,
        }}
      >
        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[85vh]">
          {isLoading ? (
            <div className="p-6 flex flex-col gap-4">
              <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-8 w-64 rounded bg-white/5 animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : !game ? (
            <div className="p-6 text-center text-text-muted">Game not found</div>
          ) : (
            <>
              <ModalHeader
                game={game}
                onClose={onClose}
                onExpand={handleExpand}
              />
              <ModalStats game={game} />
              <ModalMarkets game={game} />
              <GameComments gameId={game.gameId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
});

/* ── Main export: switches between desktop modal and mobile carousel ── */

export function GameModalV2({
  gameId,
  siblingIds,
  onClose,
  onNavigate,
}: {
  gameId: string;
  siblingIds: string[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const handleExpand = (id: string) => {
    onClose();
    router.push(`/game/${id}`);
  };

  if (isDesktop) {
    return <DesktopModal gameId={gameId} onClose={onClose} />;
  }

  return (
    <ModalCarousel
      gameId={gameId}
      siblingIds={siblingIds}
      onClose={onClose}
      onExpand={handleExpand}
      onNavigate={onNavigate}
    />
  );
}
