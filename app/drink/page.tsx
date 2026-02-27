"use client";

import Leaderboard from "@/components/leaderboard";
import DrinkRegistration from "@/components/DrinkRegistration";

export default function DrinkPage() {
  return (
    <main className="p-4">
        <DrinkRegistration />
        <Leaderboard />
    </main>
  );
}