import type { InternalAccountRole, LocalizedText, OrderChannel, OrderStatus } from "@chicc/types";
import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/require-internal-user";
import { createClient } from "@/lib/supabase/server";
import { OrdersBoard } from "./orders-board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · CHICC Staff" };

type OrderRow = {
  id: string; channel: OrderChannel; status: OrderStatus; customer_name: string; customer_phone: string;
  delivery_address: Record<string, string>; delivery_notes: string | null; assigned_worker_id: string | null;
  currency_code: string; total_minor: string | number; created_at: string;
};
type ItemRow = {
  id: string; order_id: string; product_name_i18n: LocalizedText; quantity: number;
  unit_price_minor: string | number; line_total_minor: string | number;
};
type Worker = { id: string; display_name: string | null };

type OrdersPageProps = { searchParams: Promise<{ notice?: string }> };

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireInternalUser();
  if (!(["staff", "manager", "delivery_worker"] as string[]).includes(user.role)) redirect("/");
  const canManage = user.role === "staff" || user.role === "manager";
  const supabase = await createClient();
  const params = await searchParams;
  const ordersResult = await supabase
    .from("orders")
    .select("id, channel, status, customer_name, customer_phone, delivery_address, delivery_notes, assigned_worker_id, currency_code, total_minor, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  let itemRows: ItemRow[] = [];
  let workers: Worker[] = [];
  let relatedError = false;
  const orderRows = (ordersResult.data ?? []) as OrderRow[];

  if (!ordersResult.error && orderRows.length > 0) {
    const itemResult = await supabase
      .from("order_items")
      .select("id, order_id, product_name_i18n, quantity, unit_price_minor, line_total_minor")
      .in("order_id", orderRows.map((order) => order.id));
    itemRows = (itemResult.data ?? []) as ItemRow[];
    relatedError ||= Boolean(itemResult.error);
  }

  if (canManage) {
    const workersResult = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("role", "delivery_worker")
      .eq("is_active", true)
      .order("display_name");
    workers = (workersResult.data ?? []) as Worker[];
    relatedError ||= Boolean(workersResult.error);
  }

  const itemsByOrder = new Map<string, ItemRow[]>();
  for (const item of itemRows) {
    const rows = itemsByOrder.get(item.order_id) ?? [];
    rows.push(item);
    itemsByOrder.set(item.order_id, rows);
  }
  const orders = orderRows.map((order) => ({ ...order, items: itemsByOrder.get(order.id) ?? [] }));
  const loadError = Boolean(ordersResult.error || relatedError);

  return (
    <OrdersBoard
      orders={orders}
      workers={workers}
      role={user.role as InternalAccountRole}
      loadError={loadError}
      notice={params.notice ?? null}
    />
  );
}
