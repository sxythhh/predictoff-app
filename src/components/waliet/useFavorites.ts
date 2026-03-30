"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "predictoff-favorites";

function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getFavorites);

  const toggle = useCallback((gameId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((gameId: string) => favorites.includes(gameId), [favorites]);

  return { favorites, toggle, isFavorite };
}
