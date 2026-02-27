"use client";

import Leaderboard from "@/components/leaderboard";
import AdminSlideshow from "@/components/AdminSlideshow";

export default function AdminPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-3rem)]">
        {/* Left: Leaderboard */}
        <aside className="col-span-4 overflow-auto">
          <Leaderboard title="Leaderboard" limit={50} />
        </aside>

        {/* Right: Admin panel / slideshow */}
        <section className="col-span-8">
          {/* If your bucket is PRIVATE, set useSignedUrls={true} */}
          <AdminSlideshow intervalMs={5000} limit={200} />
        </section>
      </div>
    </main>
  );
}