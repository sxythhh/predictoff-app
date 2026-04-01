"use client";

import { useState, useEffect, useRef } from "react";
import { PlayBetslip } from "./PlayBetslip";
import { useWebHaptics } from "web-haptics/react";

export function MobileBetslipDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const startYRef = useRef<number | null>(null);
  const haptic = useWebHaptics();

  // Mount on open, unmount after close animation
  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset drag state
  useEffect(() => {
    if (open) {
      setDragY(0);
      setIsDragging(false);
      startYRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) setDragY(dy);
  };

  const handleTouchEnd = () => {
    if (dragY > 120) {
      haptic.trigger("light");
      onClose();
    }
    setDragY(0);
    setIsDragging(false);
    startYRef.current = null;
  };

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 lg:hidden transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: open ? Math.max(0, 1 - dragY / 300) : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={() => { haptic.trigger("light"); onClose(); }}
      />

      {/* Drawer */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{
          transform: open
            ? `translateY(${dragY}px)`
            : "translateY(100%)",
          transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          maxHeight: "85vh",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
