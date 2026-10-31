"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/require-internal-user";
import { createClient } from "@/lib/supabase/server";

function canManageOrders(role: string): boolean {
  return role === "staff" || role === "manager";
}

export async function assignDeliveryWorker(formData: FormData): Promise<void> {
  const user = await requireInternalUser();
  if (!canManageOrders(user.role)) redirect("/orders?notice=not_authorized");
  const orderId = String(formData.get("order_id") ?? "");
  const workerId = String(formData.get("worker_id") ?? "") || null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    redirect("/orders?notice=failed");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_delivery_worker", {
    p_order_id: orderId,
    p_worker_id: workerId,
  });
  if (error) redirect("/orders?notice=failed");
  revalidatePath("/orders");
  revalidatePath("/catalog");
  redirect("/orders?notice=updated");
}

export async function transitionOrderStatus(formData: FormData): Promise<void> {
  await requireInternalUser();
  const orderId = String(formData.get("order_id") ?? "");
  const newStatus = String(formData.get("new_status") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    redirect("/orders?notice=failed");
  }
  const allowedStatuses = new Set(["confirmed", "preparing", "ready_for_delivery", "out_for_delivery", "delivered", "cancelled"]);
  if (!allowedStatuses.has(newStatus)) redirect("/orders?notice=failed");

  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order_status", {
    p_order_id: orderId,
    p_new_status: newStatus,
  });
  if (error) redirect("/orders?notice=failed");
  revalidatePath("/orders");
  if (newStatus === "cancelled") {
    revalidatePath("/catalog");
    revalidatePath("/");
  }
  redirect("/orders?notice=updated");
}
