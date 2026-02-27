"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isUsernameTaken, registerUserWithUsername, loginUserWithUsername } from "@/utils/user_service";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const is_active_user = await isUsernameTaken(username);
      
      // If username is not taken we ask if user wants to register with it, otherwise we just log them in as admin
      if (!is_active_user) {
        const proceed = confirm(`Brukernavnet "${username}" er tilgjengelig. Vil du registrere deg med det?`);
        if (proceed) {
          const { profile } = await registerUserWithUsername(username);
          router.push(profile.role === "admin" ? "/admin" : "/drink"); 
        }
      }

      // If user is taken we just log in 
      const { profile } = await loginUserWithUsername(username);
      router.push(profile.role === "admin" ? "/admin" : "/drink");
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message ?? "Klarte ikke å logge deg inn");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">Drink-Off Lite</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Skriv inn brukernavn (Gjerne navnet ditt!)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded px-4 py-2"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? "Logger inn..." : "Logg inn"}
          </button>
        </form>
      </div>
    </main>
  );
}