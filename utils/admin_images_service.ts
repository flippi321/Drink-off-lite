import { supabase } from "@/utils/supabase";

export async function fetchSlideshowImages(limit = 200) {
  const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw new Error(sessErr.message);

  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-slideshow-urls`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    },
    body: JSON.stringify({ limit, expiresIn: 600 }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `Function failed (${res.status})`);

  return json.images ?? [];
}