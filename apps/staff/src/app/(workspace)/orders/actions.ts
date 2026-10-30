"use server";

import { staffOrderEntrySchema } from "@chicc/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/require-internal-user";
import { createClient } from "@/lib/supabase/server";

export type WhatsAppOrderState = { status: "created"; token: string } | "invalid" | "not_authorized" | "save_failed" | "out_of_stock" | null;

function canManageOrders(role: string): boolean {
  return role === "staff" || role === "manager";
}

export async function createWhatsAppOrder(_previous: WhatsAppOrderState, formData: FormData): Promise<WhatsAppOrderState> {
  const user = await requireInternalUser();
  if (!canManageOrders(user.role)) return "not_authorized";

  const productIds = formData.getAll("product_ids").map((value) => String(value));
  const quantities = formData.getAll("quantities").map((value) => Number(value));
  const parsed = staffOrderEntrySchema.safeParse({
    customerName: formData.get("customer_name"),
    customerPhone: formData.get("customer_phone"),
    street: formData.get("street"),
    city: formData.get("city"),
    region: formData.get("region") ?? "",
    postalCode: formData.get("postal_code") ?? "",
    country: formData.get("country") ?? "",
    deliveryNotes: formData.get("delivery_notes") ?? "",
    items: productIds.map((product_id, index) => ({ product_id, quantity: quantities[index] })),
  });
  if (!parsed.success || productIds.length !== quantities.length) return "invalid";

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_manual_whatsapp_order", {
    p_customer_name: parsed.data.customerName,
    p_customer_phone: parsed.data.customerPhone,
    p_delivery_address: {
      street: parsed.data.street,
      city: parsed.data.city,
      region: parsed.data.region,
      postal_code: parsed.data.postalCode,
      country: parsed.data.country,
    },
    p_delivery_notes: parsed.data.deliveryNotes || null,
    p_items: parsed.data.items,
  });
  if (error) return error.message.includes("Insufficient stock") ? "out_of_stock" : "save_failed";

  revalidatePath("/orders");
  revalidatePath("/catalog");
  revalidatePath("/");
  return { status: "created", token: crypto.randomUUID() };
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
