"use client";

import type { InternalAccountRole, Locale, LocalizedText, OrderChannel, OrderStatus } from "@chicc/types";
import Link from "next/link";
import { ChiccLogo } from "@chicc/ui";
import { useEffect, useState } from "react";
import { assignDeliveryWorker, transitionOrderStatus } from "./actions";

type Worker = { id: string; display_name: string | null };
type Item = { id: string; product_name_i18n: LocalizedText; quantity: number; unit_price_minor: string | number; line_total_minor: string | number };
type Order = {
  id: string; channel: OrderChannel; status: OrderStatus; customer_name: string; customer_phone: string;
  delivery_address: Record<string, string>; delivery_notes: string | null; assigned_worker_id: string | null;
  currency_code: string; total_minor: string | number; created_at: string; items: Item[];
};
type Copy = {
  brand: string; title: string; language: string; back: string; noOrders: string; loadingError: string;
  whatsapp: string; website: string; customer: string; phone: string; address: string; notes: string;
  items: string; total: string; assignment: string; unassigned: string; assign: string; status: string;
  update: string; statuses: Record<OrderStatus, string>; created: string; updated: string; failed: string;
  notAuthorized: string; deliveries: string; orderCount: string;
};
const copy: Record<Locale, Copy> = {
  fr: { brand: "CHICC · ÉQUIPE", title: "Commandes", language: "Langue", back: "Espace équipe", noOrders: "Aucune commande pour le moment.", loadingError: "Impossible de charger les commandes. Vérifiez les migrations.", whatsapp: "WhatsApp", website: "Site web", customer: "Client", phone: "Téléphone", address: "Livraison", notes: "Instructions", items: "Articles", total: "Total", assignment: "Livreur", unassigned: "Non assigné", assign: "Affecter", status: "Statut", update: "Mettre à jour", statuses: { pending: "À confirmer", confirmed: "Confirmée", preparing: "En préparation", ready_for_delivery: "Prête à livrer", out_for_delivery: "En livraison", delivered: "Livrée", cancelled: "Annulée" }, created: "Commande enregistrée.", updated: "Commande mise à jour.", failed: "Action impossible. Vérifiez le rôle, le statut et l’affectation.", notAuthorized: "Votre compte n’est pas autorisé à gérer les commandes.", deliveries: "Livraisons", orderCount: "commandes" },
  ar: { brand: "CHICC · الفريق", title: "الطلبات", language: "اللغة", back: "مساحة الفريق", noOrders: "لا توجد طلبات حالياً.", loadingError: "تعذر تحميل الطلبات. تحقق من الترحيلات.", whatsapp: "واتساب", website: "الموقع", customer: "العميل", phone: "الهاتف", address: "التوصيل", notes: "التعليمات", items: "المنتجات", total: "الإجمالي", assignment: "عامل التوصيل", unassigned: "غير معيّن", assign: "تعيين", status: "الحالة", update: "تحديث", statuses: { pending: "بانتظار التأكيد", confirmed: "مؤكد", preparing: "قيد التحضير", ready_for_delivery: "جاهز للتوصيل", out_for_delivery: "خرج للتوصيل", delivered: "تم التوصيل", cancelled: "ملغي" }, created: "تم حفظ الطلب.", updated: "تم تحديث الطلب.", failed: "تعذر تنفيذ الإجراء. تحقق من الدور والحالة والتعيين.", notAuthorized: "حسابك غير مخوّل لإدارة الطلبات.", deliveries: "التوصيلات", orderCount: "طلبات" },
  en: { brand: "CHICC · TEAM", title: "Orders", language: "Language", back: "Workspace", noOrders: "No orders yet.", loadingError: "Could not load orders. Check that migrations are applied.", whatsapp: "WhatsApp", website: "Website", customer: "Customer", phone: "Phone", address: "Delivery address", notes: "Instructions", items: "Items", total: "Total", assignment: "Delivery worker", unassigned: "Unassigned", assign: "Assign", status: "Status", update: "Update", statuses: { pending: "Pending confirmation", confirmed: "Confirmed", preparing: "Preparing", ready_for_delivery: "Ready for delivery", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" }, created: "Order saved.", updated: "Order updated.", failed: "Action failed. Check the role, status, and assignment.", notAuthorized: "Your account cannot manage orders.", deliveries: "Deliveries", orderCount: "orders" },
};

function nextStatuses(status: OrderStatus, role: InternalAccountRole): OrderStatus[] {
  if (role === "delivery_worker") {
    if (status === "ready_for_delivery") return ["out_for_delivery"];
    if (status === "out_for_delivery") return ["delivered"];
    return [];
  }
  if (status === "pending") return ["confirmed", "cancelled"];
  if (status === "confirmed") return ["preparing", "cancelled"];
  if (status === "preparing") return ["ready_for_delivery", "cancelled"];
  if (status === "ready_for_delivery") return ["out_for_delivery", "cancelled"];
  if (status === "out_for_delivery") return ["delivered"];
  return [];
}

function localized(value: Partial<LocalizedText>, locale: Locale) {
  return value[locale] || value.fr || value.en || "";
}

function formatTotal(amount: string | number, currency: string, locale: Locale) {
  const value = Number(amount);
  if (!Number.isSafeInteger(value)) return "";
  try {
    const formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    return formatter.format(value / 10 ** digits);
  } catch { return ""; }
}

function deliveryAddress(address: Record<string, string>) {
  return [address.street, address.postal_code, address.city, address.region, address.country].filter(Boolean).join(", ");
}

export function OrdersBoard({
  orders, workers, role, loadError, notice,
}: {
  orders: Order[]; workers: Worker[]; role: InternalAccountRole; loadError: boolean; notice: string | null;
}) {
  const [locale, setLocale] = useState<Locale>("fr");
  const text = copy[locale];
  const canManage = role === "staff" || role === "manager";
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  const noticeText = notice === "created" ? text.created : notice === "updated" ? text.updated : notice === "failed" ? text.failed : notice === "not_authorized" ? text.notAuthorized : "";

  return (
    <main className="orders-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="dashboard-topbar">
        <Link className="catalog-brand brand-lockup" href="/"><ChiccLogo className="brand-logo" /><span className="eyebrow">{text.brand}</span></Link>
        <div className="orders-header-tools">
          <Link className="secondary-button action-link" href="/">{text.back}</Link>
          <label className="language-picker"><span>{text.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option>
            </select>
          </label>
        </div>
      </header>
      <h1>{text.title}</h1>
      {noticeText && <p className={notice === "created" || notice === "updated" ? "success-message" : "form-message"} role="status">{noticeText}</p>}
      {loadError && <p className="form-message" role="alert">{text.loadingError}</p>}
      {!loadError && orders.length === 0 && <p className="empty-note">{text.noOrders}</p>}
      <section className="orders-list">
        {orders.map((order) => {
          const changes = nextStatuses(order.status, role);
          return (
            <article className="order-card" key={order.id}>
              <header className="order-card-header">
                <div><span className="eyebrow">{order.channel === "whatsapp" ? text.whatsapp : text.website}</span><small>{new Date(order.created_at).toLocaleString(locale)}</small></div>
                <span className="status-pill">{text.statuses[order.status]}</span>
              </header>
              <div className="order-contact">
                <strong>{order.customer_name}</strong>
                <a href={`tel:${encodeURIComponent(order.customer_phone)}`}>{order.customer_phone}</a>
              </div>
              <p className="order-address"><strong>{text.address}:</strong> {deliveryAddress(order.delivery_address)}</p>
              {order.delivery_notes && <p className="order-address"><strong>{text.notes}:</strong> {order.delivery_notes}</p>}
              <div className="order-items">
                <strong>{text.items}</strong>
                <ul>{order.items.map((item) => <li key={item.id}><span>{localized(item.product_name_i18n, locale)} × {item.quantity}</span><span>{formatTotal(item.line_total_minor, order.currency_code, locale)}</span></li>)}</ul>
                <p><strong>{text.total}: {formatTotal(order.total_minor, order.currency_code, locale)}</strong></p>
              </div>
              {canManage && order.status !== "delivered" && order.status !== "cancelled" && (
                <form action={assignDeliveryWorker} className="assignment-form">
                  <input type="hidden" name="order_id" value={order.id} />
                  <label><span>{text.assignment}</span><select name="worker_id" defaultValue={order.assigned_worker_id ?? ""}><option value="">{text.unassigned}</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.display_name || worker.id.slice(0, 8)}</option>)}</select></label>
                  <button className="secondary-button" type="submit">{text.assign}</button>
                </form>
              )}
              {changes.length > 0 && (
                <form action={transitionOrderStatus} className="transition-form">
                  <input type="hidden" name="order_id" value={order.id} />
                  <label><span>{text.status}</span><select name="new_status" defaultValue={changes[0]}>{changes.map((status) => <option key={status} value={status}>{text.statuses[status]}</option>)}</select></label>
                  <button className="primary-button" type="submit">{text.update}</button>
                </form>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

