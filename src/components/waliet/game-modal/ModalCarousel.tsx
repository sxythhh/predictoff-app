"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useGame } from "@azuro-org/sdk";
import { ModalHeader } from "./ModalHeader";
import { ModalStats } from "./ModalStats";
import { ModalMarkets } from "./ModalMarkets";
import { useTeamGradient } from "./useTeamGradient";
import { GameComments } from "@/components/social/GameComments";
import { useWebHaptics } from "web-haptics/react";

/* ── Single game card for the carousel ── */

const CarouselCard = memo(function CarouselCard({
  gameId,
  onClose,
  onExpand,
}: {
  gameId: string;
  onClose: () => void;
  onExpand: (id: string) => void;
}) {
  const { data: game, isLoading } = useGame({ gameId });
  const { gradient } = useTeamGradient(game ?? undefined);

  if (isLoading || !game) {
    return (
      <div className="carousel-card rounded-2xl bg-bg-modal overflow-hidden">
        <div className="p-6 flex flex-col gap-4 animate-pulse">
          <div className="h-32 rounded-xl bg-white/5" />
          <div className="h-6 w-48 rounded bg-white/5" />
          <div className="h-20 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="carousel-card rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl"
      style={{ background: gradient }}
    >
      <div data-card-scroll className="overflow-y-auto max-h-[calc(85vh-56px)]">
        <ModalHeader
          game={game}
          onClose={onClose}
          onExpand={() => onExpand(gameId)}
          compact
        />
        <ModalStats game={game} />
        <ModalMarkets game={game} />
        <GameComments gameId={gameId} />
      </div>
    </div>
  );
});

/* ── Mobile Carousel Drawer ── */

export function ModalCarousel({
  gameId,
  siblingIds,
  onClose,
  onExpand,
  onNavigate,
}: {
  gameId: string;
  siblingIds: string[];
  onClose: () => void;
  onExpand: (id: string) => void;
  onNavigate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const haptic = useWebHaptics();

  // Build the list of game IDs for the carousel
  const gameIds = siblingIds.length > 1 ? siblingIds : [gameId];
  const currentIndex = gameIds.indexOf(gameId);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;

  // Mount + animate in
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true));
    });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Scroll to the current game on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || gameIds.length <= 1) return;
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width ?? 0;
    const gap = 12;
    el.scrollLeft = startIndex * (cardWidth + gap);
  }, [startIndex, gameIds.length]);

  // Detect scroll snap settle → navigate to new game
  const lastSettledRef = useRef(gameId);
  const handleScrollEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el || gameIds.length <= 1) return;
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width ?? 0;
    const gap = 12;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    const settledId = gameIds[Math.min(index, gameIds.length - 1)];
    if (settledId && settledId !== lastSettledRef.current) {
      lastSettledRef.current = settledId;
      haptic.trigger("selection");
      onNavigate(settledId);
    }
  }, [gameIds, haptic, onNavigate]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scrollend", handleScrollEnd, { passive: true });
    return () => el.removeEventListener("scrollend", handleScrollEnd);
  }, [handleScrollEnd]);

  // Drag to dismiss — works from handle OR anywhere when content scrolled to top
  const draggingRef = useRef(false);
  const dragYRef = useRef(0);

  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollable = target.closest("[data-card-scroll]");
      const isScrolledToTop = !scrollable || scrollable.scrollTop <= 0;

      if (isScrolledToTop) {
        startYRef.current = e.touches[0].clientY;
        draggingRef.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) {
        if (dy > 8) draggingRef.current = true;
        if (draggingRef.current) {
          e.preventDefault();
          dragYRef.current = dy;
          setDragY(dy);
        }
      } else {
        startYRef.current = null;
        draggingRef.current = false;
      }
    };

    const onTouchEnd = () => {
      if (dragYRef.current > 100) {
        haptic.trigger("light");
        setOpen(false);
        setTimeout(onClose, 320);
      }
      dragYRef.current = 0;
      setDragY(0);
      startYRef.current = null;
      draggingRef.current = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [haptic, onClose]);

  const handleBackdropClick = () => {
    haptic.trigger("light");
    setOpen(false);
    setTimeout(onClose, 320);
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: open ? Math.max(0, 1 - dragY / 300) : 0,
        }}
        onClick={handleBackdropClick}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute inset-x-0 bottom-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
          maxHeight: "88vh",
        }}
      >
        {/* Carousel scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-8 pb-[env(safe-area-inset-bottom,16px)] scrollbar-hide"
          style={{
            scrollPaddingInline: "32px",
            overscrollBehaviorX: "contain",
          }}
        >
          {gameIds.map((id) => (
            <CarouselCard
              key={id}
              gameId={id}
              onClose={() => {
                setOpen(false);
                setTimeout(onClose, 320);
              }}
              onExpand={onExpand}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
