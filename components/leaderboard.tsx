"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaderboardRow } from "@/utils/leaderboard_service";
import { fetchLeaderboard, subscribeLeaderboard } from "@/utils/leaderboard_service";

type Props = {
  limit?: number;
  title?: string;
};

export default function Leaderboard({ limit = 50, title = "Leaderboard" }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const data = await fetchLeaderboard(limit);
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  let isMounted = true;
  let pollingTimer: number | null = null;
  let loadingRef = false;

  async function safeLoad() {
    if (loadingRef) return; // prevent overlapping fetches
    loadingRef = true;

    try {
      const data = await fetchLeaderboard(limit);
      if (isMounted) setRows(data);
    } catch (e: any) {
      if (isMounted) setError(e?.message ?? "Failed to load leaderboard");
    } finally {
      loadingRef = false;
      if (isMounted) setLoading(false);
    }
  }

  // Initial load
  safeLoad();

  // Realtime subscription
  const unsubscribe = subscribeLeaderboard(() => {
    safeLoad();
  });

  // Poll every 10 seconds
  pollingTimer = window.setInterval(() => {
    safeLoad();
  }, 10000);

  return () => {
    isMounted = false;
    unsubscribe();
    if (pollingTimer) window.clearInterval(pollingTimer);
  };
}, [limit]);

  const content = useMemo(() => {
    if (loading) return <p className="text-sm opacity-70">Loading…</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (rows.length === 0) return <p className="text-sm opacity-70">No drinks yet.</p>;

    return (
      <ol className="divide-y border rounded">
        {rows.map((r, idx) => (
          <li key={r.username} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="w-6 text-right tabular-nums opacity-60">{idx + 1}</span>
              <span className="font-medium">{r.username}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm opacity-70">
                {r.drinks_count} drinks
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {r.units_total} pts
              </span>
            </div>
          </li>
        ))}
      </ol>
    );
  }, [rows, loading, error]);

  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="text-sm underline opacity-80 hover:opacity-100"
        >
          Refresh
        </button>
      </div>

      {content}
    </section>
  );
}