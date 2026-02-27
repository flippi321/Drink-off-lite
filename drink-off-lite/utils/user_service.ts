import { supabase } from "@/utils/supabase";
import { Profile, UserRole } from "@/types/user_types";

type LoginResult = {
  profile: Profile;
  role: UserRole;
};

export async function isUsernameTaken(username: string): Promise<boolean> {
  const trimmed = username.trim();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", trimmed)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found (normal case)
    throw new Error(error.message);
  }

  return !!data;
}

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

export async function loginUserWithUsername(username: string): Promise<LoginResult> {
  const trimmed = username.trim();

  // Ensure we are authenticated so RLS (authenticated) can read profiles
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    const { error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw new Error(authError.message);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, role, created_at")
    .eq("username", trimmed)
    .single();

  if (error) throw new Error(error.message);

  const p = profile as Profile;

  return { profile: p, role: p.role };
}