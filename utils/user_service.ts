import { supabase } from "@/utils/supabase";
import type { Profile, UserRole } from "@/types/user_types";

type LoginResult = {
  profile: Profile;
  role: UserRole;
};

async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(error.message);
  }
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const trimmed = username.trim();
  if (!trimmed) return false;

  // Ensure consistent RLS behavior on first load
  await ensureSession();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", trimmed)
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function registerUserWithUsername(username: string): Promise<LoginResult> {
  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 24) {
    throw new Error("Username must be 2–24 characters.");
  }

  // Always create a session first
  await ensureSession();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw new Error(userErr.message);
  const userId = userData.user?.id;
  if (!userId) throw new Error("No authenticated user");

  const { data: inserted, error: insErr } = await supabase
    .from("profiles")
    .insert({ id: userId, username: trimmed })
    .select("id, username, role, created_at")
    .single();

  if (insErr) throw new Error(insErr.message);

  const profile = inserted as Profile;
  return { profile, role: profile.role };
}

export async function loginUserWithUsername(username: string): Promise<LoginResult> {
  const trimmed = username.trim();
  if (!trimmed) throw new Error("Username is required.");

  await ensureSession();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, role, created_at")
    .eq("username", trimmed)
    .limit(1);

  if (error) throw new Error(error.message);

  const profile = (data?.[0] ?? null) as Profile | null;
  if (!profile) throw new Error("User not found.");

  return { profile, role: profile.role };
}