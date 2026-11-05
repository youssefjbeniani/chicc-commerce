"use server";

import { teamProvisionSchema } from "@chicc/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/require-internal-user";
import { createClient } from "@/lib/supabase/server";

export type ProvisionTeamState = { status: "created"; token: string } | "invalid" | "not_ready" | "not_authorized" | "save_failed" | null;

export async function provisionTeamMember(_previous: ProvisionTeamState, formData: FormData): Promise<ProvisionTeamState> {
  const user = await requireInternalUser();
  if (user.role !== "manager") return "not_authorized";

  const parsed = teamProvisionSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("display_name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return "invalid";

  const supabase = await createClient();
  const { error } = await supabase.rpc("provision_internal_account", {
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_display_name: parsed.data.displayName || null,
  });
  if (error?.code === "P0002") return "not_ready";
  if (error) return error.code === "42501" ? "not_authorized" : "save_failed";

  revalidatePath("/team");
  return { status: "created", token: crypto.randomUUID() };
}

export async function updateTeamMember(formData: FormData): Promise<void> {
  const user = await requireInternalUser();
  if (user.role !== "manager") redirect("/team?notice=not_authorized");

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  const active = String(formData.get("active") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
      || !["staff", "delivery_worker", "manager"].includes(role)
      || !["active", "inactive"].includes(active)) {
    redirect("/team?notice=failed");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_internal_account", {
    p_user_id: userId,
    p_role: role,
    p_is_active: active === "active",
  });
  if (error) redirect(error.code === "P0002" ? "/team?notice=not_found" : "/team?notice=failed");
  revalidatePath("/team");
  revalidatePath("/orders");
  redirect("/team?notice=updated");
}
