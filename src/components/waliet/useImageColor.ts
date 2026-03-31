"use client";

import { useEffect, useState } from "react";

const colorCache = new Map<string, string>();

// In-flight deduplication: if two hooks request the same URL, share the promise
const pendingRequests = new Map<string, Promise<string | null>>();

// Concurrency limiter: max 3 image extractions at a time
let activeCount = 0;
const MAX_CONCURRENT = 3;
const queue: Array<() => void> = [];

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      activeCount++;
      fn()
        .then(resolve, reject)
        .finally(() => {
          activeCount--;
          if (queue.length > 0) {
            const next = queue.shift()!;
            next();
          }
        });
    };
    if (activeCount < MAX_CONCURRENT) {
      run();
    } else {
      queue.push(run);
    }
  });
}

function extractColor(imageUrl: string): Promise<string | null> {
  // Deduplicate concurrent requests for the same URL
  const existing = pendingRequests.get(imageUrl);
  if (existing) return existing;

  const promise = enqueue(async () => {
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
      const resp = await fetch(proxyUrl);
      if (!resp.ok) return null;
      const blob = await resp.blob();

      return new Promise<string | null>((resolve) => {
        const blobUrl = URL.createObjectURL(blob);
        const img = new window.Image();

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(null); return; }

            const size = 32;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);

            const imageData = ctx.getImageData(0, 0, size, size).data;
            const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

            for (let i = 0; i < imageData.length; i += 4) {
              const r = imageData[i];
              const g = imageData[i + 1];
              const b = imageData[i + 2];
              const a = imageData[i + 3];

              if (a < 128) continue;
              if (r + g + b < 60) continue;
              if (r > 230 && g > 230 && b > 230) continue;

              const br = Math.round(r / 32) * 32;
              const bg = Math.round(g / 32) * 32;
              const bb = Math.round(b / 32) * 32;
              const key = `${br},${bg},${bb}`;

              const ex = buckets.get(key);
              if (ex) {
                ex.r += r;
                ex.g += g;
                ex.b += b;
                ex.count++;
              } else {
                buckets.set(key, { r, g, b, count: 1 });
              }
            }

            let best: { r: number; g: number; b: number; count: number } | null = null;
            for (const bucket of buckets.values()) {
              if (!best || bucket.count > best.count) best = bucket;
            }

            if (best && best.count > 0) {
              const avgR = Math.round(best.r / best.count);
              const avgG = Math.round(best.g / best.count);
              const avgB = Math.round(best.b / best.count);
              resolve(`rgb(${avgR}, ${avgG}, ${avgB})`);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          } finally {
            URL.revokeObjectURL(blobUrl);
          }
        };

        img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null); };
        img.src = blobUrl;
      });
    } catch {
      return null;
    }
  }).finally(() => {
    pendingRequests.delete(imageUrl);
  });

  pendingRequests.set(imageUrl, promise);
  return promise;
}

/**
 * Extracts the dominant color from an image URL.
 * Fetches via proxy to bypass CORS, with concurrency limiting and deduplication.
 */
// Skip color extraction on mobile — canvas getImageData blocks main thread
const IS_MOBILE_DEVICE = typeof window !== "undefined" && window.innerWidth < 1024;

export function useImageColor(imageUrl: string | undefined | null): string | null {
  const [color, setColor] = useState<string | null>(
    imageUrl ? colorCache.get(imageUrl) ?? null : null
  );

  useEffect(() => {
    if (!imageUrl || IS_MOBILE_DEVICE) return;
    if (colorCache.has(imageUrl)) {
      setColor(colorCache.get(imageUrl)!);
      return;
    }

    let cancelled = false;

    extractColor(imageUrl).then((result) => {
      if (cancelled) return;
      if (result) {
        colorCache.set(imageUrl, result);
        setColor(result);
      }
    });

    return () => { cancelled = true; };
  }, [imageUrl]);

  return color;
}

export function darkenColor(rgb: string, amount: number): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  const r = Math.round(Number(match[1]) * (1 - amount));
  const g = Math.round(Number(match[2]) * (1 - amount));
  const b = Math.round(Number(match[3]) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Lighten a color by mixing with white. Amount 0 = original, 1 = pure white. */
export function lightenColor(rgb: string, amount: number): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  const r = Math.round(Number(match[1]) + (255 - Number(match[1])) * amount);
  const g = Math.round(Number(match[2]) + (255 - Number(match[2])) * amount);
  const b = Math.round(Number(match[3]) + (255 - Number(match[3])) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate a deterministic color from a team name string.
 * Used as fallback when no team logo image is available.
 */
export function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate HSL with fixed saturation and lightness for vivid but not blinding colors
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

/**
 * Convert HSL string to RGB string for darkenColor compatibility
 */
export function hslToRgb(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return hsl;
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}
