import { supabase } from "@/utils/supabase";
import { Profile, UserRole } from "@/types/user_types";
import { version } from "node:punycode";

type LoginResult = {
  profile: Profile;
  role: UserRole;
};

export async function registerUserWithUsername(username: string): Promise<LoginResult> {
  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 24) {
    throw new Error("Username must be 2–24 characters.");
  }

  // 1) Create Auth user/session
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) throw new Error(authError.message);

  const userId = authData.user?.id;
  if (!userId) throw new Error("No user returned from anonymous sign-in");

  // 2) Create profile (register semantics)
  const { data: profile, error: insErr } = await supabase
    .from("profiles")
    .insert({ id: userId, username: trimmed })
    .select("id, username, role, created_at")
    .single();

  if (insErr) throw new Error(insErr.message);
  return { profile: profile as Profile, role: (profile as Profile).role };
}

/**
 * Username login:
 * 1) anonymous sign-in (creates session)
 * 2) call edge function auth-upsert-profile
 * 3) return profile + role
 */
export async function loginWithUsername(username: string): Promise<LoginResult> {
  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 24) {
    throw new Error("Username must be 2–24 characters.");
  }

  // Ensure client env vars exist
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  // IMPORTANT: standardize on ANON key name in your .env.local
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!anonKey) {
    throw new Error(
      "Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY (recommended) or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
    );
  }

  // 1) Anonymous sign-in
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) throw new Error(authError.message);

  const session = authData.session;
  if (!session?.access_token) throw new Error("No access token returned");

  // 2) Edge Function call
  const fnUrl = `${supabaseUrl}/functions/v1/auth-register-profile`;

  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // send both forms to avoid header weirdness
      Authorization: `Bearer ${session.access_token}`,
      "X-Supabase-Auth": session.access_token,
      apikey: anonKey,
    },
    body: JSON.stringify({ username: trimmed }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Prefer server-provided error message
    throw new Error(json?.error ?? `Edge Function failed (${res.status})`);
  }

  if (!json?.profile) throw new Error("Profile not returned");

  const profile: Profile = json.profile;
  const role: UserRole = profile.role;

  return { profile, role };
}