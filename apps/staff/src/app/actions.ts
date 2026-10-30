"use server";

import { isInternalRole } from "@chicc/types";
import { staffSignInSchema } from "@chicc/validation";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type LoginError = "invalid_credentials" | "not_authorized" | "setup_required" | null;

export async function signIn(_previous: LoginError, formData: FormData): Promise<LoginError> {
  if (!isSupabaseConfigured()) return "setup_required";

  const parsed = staffSignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return "invalid_credentials";

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword(parsed.data);
  if (authError || !authData.user) return "invalid_credentials";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return "setup_required";
  }
  if (!profile?.is_active || !isInternalRole(profile.role)) {
    await supabase.auth.signOut();
    return "not_authorized";
  }

  redirect("/");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
