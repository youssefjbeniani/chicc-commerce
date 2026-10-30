import { isInternalRole } from "@chicc/types";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "./supabase/server";

export const requireInternalUser = cache(async function requireInternalUser() {
  if (!isSupabaseConfigured()) redirect("/login?setup=supabase");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) redirect("/login?setup=database");
  if (!profile?.is_active || !isInternalRole(profile.role)) {
    await supabase.auth.signOut();
    redirect("/login?error=not_authorized");
  }

  return {
    id: userId,
    role: profile.role,
    displayName: profile.display_name,
    email: claimsData.claims.email ?? "",
  };
});
