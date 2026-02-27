import { supabase } from "@/utils/supabase";

export type LeaderboardRow = {
  username: string;
  drinks_count: number;
  units_total: number;
  last_drink_at: string | null;
};

// Fetch the leaderboard view
export async function fetchLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("username, drinks_count, units_total, last_drink_at")
    .order("units_total", { ascending: false })
    .order("drinks_count", { ascending: false })
    .order("last_drink_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardRow[];
}

/**
 * Subscribe to changes on drinks and invoke callback when something changes.
 * This keeps the client simple: on any INSERT/UPDATE/DELETE, you refetch leaderboard.
 *
 * Returns an unsubscribe function.
 */
export function subscribeLeaderboard(onChange: () => void) {
  const channel = supabase
    .channel("leaderboard-drinks-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "drinks" },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}