"use client";

import { useRef, useState, useCallback, startTransition, type RefObject } from "react";

export interface ItemRect {
  top: number;
  height: number;
  left: number;
  width: number;
}

interface UseProximityHoverReturn {
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  itemRects: ItemRect[];
  sessionRef: RefObject<number>;
  handlers: {
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  registerItem: (index: number, element: HTMLElement | null) => void;
  measureItems: () => void;
}

export function useProximityHover<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  options?: { axis?: "x" | "y" },
): UseProximityHoverReturn {
  const axis = options?.axis ?? "y";
  const itemsRef = useRef(new Map<number, HTMLElement>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [itemRects, setItemRects] = useState<ItemRect[]>([]);
  const sessionRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pendingMousePos = useRef<number | null>(null);

  const registerItem = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (element) {
        itemsRef.current.set(index, element);
      } else {
        itemsRef.current.delete(index);
      }
    },
    []
  );

  const measureItems = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const borderTop = container.clientTop;
    const borderLeft = container.clientLeft;
    const rects: ItemRect[] = [];
    itemsRef.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      rects[index] = {
        top: rect.top - containerRect.top - borderTop + container.scrollTop,
        height: rect.height,
        left: rect.left - containerRect.left - borderLeft + container.scrollLeft,
        width: rect.width,
      };
    });
    setItemRects(rects);
  }, [containerRef]);

  // RAF-throttled computation to avoid layout thrashing on every mousemove
  const computeProximity = useCallback(() => {
    const container = containerRef.current;
    const mousePos = pendingMousePos.current;
    if (!container || mousePos == null) return;

    const containerRect = container.getBoundingClientRect();
    const borderTop = container.clientTop;
    const borderLeft = container.clientLeft;

    let closestIndex: number | null = null;
    let closestDistance = Infinity;
    const rects: ItemRect[] = [];

    itemsRef.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      rects[index] = {
        top: rect.top - containerRect.top - borderTop + container.scrollTop,
        height: rect.height,
        left: rect.left - containerRect.left - borderLeft + container.scrollLeft,
        width: rect.width,
      };

      const itemCenter = axis === "x"
        ? rect.left + rect.width / 2
        : rect.top + rect.height / 2;
      const distance = Math.abs(mousePos - itemCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    startTransition(() => {
      setItemRects(rects);
      setActiveIndex(closestIndex);
    });
    rafRef.current = null;
  }, [containerRef, axis]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      pendingMousePos.current = axis === "x" ? e.clientX : e.clientY;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(computeProximity);
      }
    },
    [axis, computeProximity]
  );

  const handleMouseEnter = useCallback(() => {
    sessionRef.current += 1;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingMousePos.current = null;
    setActiveIndex(null);
  }, []);

  return {
    activeIndex,
    setActiveIndex,
    itemRects,
    sessionRef,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    registerItem,
    measureItems,
  };
}
