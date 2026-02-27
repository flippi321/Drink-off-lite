import { supabase } from "@/utils/supabase";

export type DrinkType = "Beer" | "Wine" | "Shot" | "Other";

export type DrinkInsertResult = {
  drinkId: number;
  photoPath: string | null;
};

function getExtFromFile(file: File): string {
  const t = file.type.toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  return "jpg";
}

export async function registerDrink(params: {
  type: DrinkType;
  photoFile: File; // required for your UX
  amount?: number; // default 1
}): Promise<DrinkInsertResult> {
  const { type, photoFile } = params;
  const amount = params.amount ?? 1;

  // Ensure logged in (anonymous is fine)
  const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw new Error(sessErr.message);

  if (!sessionData.session) {
    const { error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw new Error(authError.message);
  }

  // Get user id (for storage path)
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw new Error(userErr.message);
  const userId = userData.user?.id;
  if (!userId) throw new Error("No authenticated user");

  // 1) Insert drink row first (no photo_path yet)
  const { data: drinkRow, error: insErr } = await supabase
    .from("drinks")
    .insert({ user_id: userId, type, amount })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);

  const drinkId = drinkRow.id as number;

  // 2) Upload photo
  const ext = getExtFromFile(photoFile);
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  const photoPath = `${userId}/${yyyy}-${mm}-${dd}/${drinkId}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("drink-photos")
    .upload(photoPath, photoFile, {
      contentType: photoFile.type || "image/jpeg",
      upsert: false,
    });

  if (upErr) throw new Error(upErr.message);

  // 3) Update drink with photo_path
  const { data: updated, error: updErr } = await supabase
    .from("drinks")
    .update({ photo_path: photoPath })
    .match({ id: drinkId, user_id: userId })
    .select("id, photo_path")
    .maybeSingle();

  if (updErr) throw new Error(updErr.message);

  if (!updated) {
    throw new Error(
      "No drink row was updated. Most likely: UPDATE is blocked by RLS, or user_id doesn't match the inserted row."
    );
  }

  if (!updated.photo_path) {
    throw new Error("Update ran but photo_path is still null.");
  }

  return { drinkId, photoPath };
}