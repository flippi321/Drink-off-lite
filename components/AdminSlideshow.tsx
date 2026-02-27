"use client";

import { useEffect, useRef, useState } from "react";
import { fetchSlideshowImages } from "@/utils/admin_images_service";
import type { SlideshowImage } from "@/types/admin_img_types";

type Props = {
  intervalMs?: number;
  limit?: number;
};

export default function AdminSlideshow({
  intervalMs = 3500,
  limit = 200,
}: Props) {
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  async function refresh() {
    try {
      setError(null);
      setLoading(true);
      const next = await fetchSlideshowImages({ limit });
      console.log("Fetched slideshow images:", next);
      setImages(next);
      setIdx(0);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load slideshow images");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // Advance loop
  useEffect(() => {
    if (loading) return;
    if (images.length === 0) return;

    function clear() {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    clear();
    timerRef.current = window.setInterval(async () => {
      // start fade out
      setFadeIn(false);

      // wait for fade-out
      window.setTimeout(async () => {
        setIdx((prev) => {
          const next = prev + 1;

          // Wrap -> refresh list
          if (next >= images.length) {
            // Refresh asynchronously; keep showing last image until refresh completes
            refresh();
            return 0;
          }
          return next;
        });

        // fade back in
        setFadeIn(true);
      }, 250);
    }, intervalMs);

    return () => clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, loading, intervalMs]);

  const current = images[idx];

  return (
    <section className="w-full h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold">Admin panel</h2>
        <button
          type="button"
          onClick={() => refresh()}
          className="text-sm underline opacity-80 hover:opacity-100"
        >
          Refresh now
        </button>
      </div>

      <div className="flex-1 border rounded overflow-hidden bg-black/5 flex items-center justify-center">
        {loading && <p className="text-sm opacity-70">Loading images…</p>}

        {!loading && error && (
          <p className="text-sm text-red-600 p-4">{error}</p>
        )}

        {!loading && !error && images.length === 0 && (
          <p className="text-sm opacity-70 p-4">No images yet.</p>
        )}
        
        {!loading && !error && current && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.url}
            className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
              fadeIn ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      {!loading && !error && images.length > 0 && (
        <div className="mt-2 text-xs opacity-60 flex justify-between">
          <span>
            {idx + 1} / {images.length}
          </span>
          <span className="truncate max-w-[70%]">{current?.photo_path}</span>
        </div>
      )}
    </section>
  );
}