"use client";

import { useState, useEffect, useRef } from "react";
import { PlayBetslip } from "./PlayBetslip";
import { useWebHaptics } from "web-haptics/react";

export function MobileBetslipDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const haptic = useWebHaptics();

  // Reset drag state when open changes
  useEffect(() => {
    setDragY(0);
    setIsDragging(false);
    startYRef.current = null;
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

  if (!open && dragY === 0) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 lg:hidden"
        style={{ opacity: open ? Math.max(0, 1 - dragY / 300) : 0 }}
        onClick={() => { haptic.trigger("light"); onClose(); }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
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
