"use client";

import type { Locale, LocalizedText } from "@chicc/types";
import { useActionState, useEffect, useRef, useState } from "react";
import { createWhatsAppOrder, type WhatsAppOrderState } from "./actions";

type ProductChoice = { id: string; name_i18n: LocalizedText; sku: string | null; currency_code: string; stock_quantity: number | string | null };
type Copy = {
  title: string; hint: string; customer: string; phone: string; street: string; city: string;
  region: string; postalCode: string; country: string; notes: string; items: string;
  product: string; selectProduct: string; quantity: string; addLine: string; remove: string;
  submit: string; saving: string; created: string; invalid: string; denied: string; failed: string; stock: string; outOfStock: string;
};
const copy: Record<Locale, Copy> = {
  fr: { title: "Saisir une commande WhatsApp", hint: "La commande sera enregistrée comme demande et restera en attente de confirmation.", customer: "Nom du client", phone: "Téléphone", street: "Adresse", city: "Ville", region: "Région", postalCode: "Code postal", country: "Pays", notes: "Instructions de livraison", items: "Articles", product: "Produit", selectProduct: "Choisir un produit", quantity: "Quantité", addLine: "Ajouter un article", remove: "Retirer", submit: "Enregistrer la commande", saving: "Enregistrement…", created: "Commande WhatsApp enregistrée.", invalid: "Vérifiez les champs et les articles. Les quantités doivent être entre 1 et 25.", denied: "Votre compte ne peut pas saisir des commandes.", failed: "Impossible d’enregistrer la commande. Vérifiez que les migrations sont appliquées et que les produits sont publiés.", stock: "Disponible", outOfStock: "Épuisé" },
  ar: { title: "إدخال طلب واتساب", hint: "سيتم حفظ الطلب بانتظار التأكيد.", customer: "اسم العميل", phone: "الهاتف", street: "العنوان", city: "المدينة", region: "المنطقة", postalCode: "الرمز البريدي", country: "الدولة", notes: "تعليمات التوصيل", items: "المنتجات", product: "المنتج", selectProduct: "اختر منتجاً", quantity: "الكمية", addLine: "إضافة منتج", remove: "إزالة", submit: "حفظ الطلب", saving: "جارٍ الحفظ…", created: "تم حفظ طلب واتساب.", invalid: "تحقق من الحقول والمنتجات. يجب أن تكون الكمية بين 1 و25.", denied: "حسابك غير مخوّل لإدخال الطلبات.", failed: "تعذر حفظ الطلب. تحقق من تطبيق الترحيلات ونشر المنتجات.", stock: "متاح", outOfStock: "نفد المخزون" },
  en: { title: "Enter a WhatsApp order", hint: "The order is saved as a request and waits for confirmation.", customer: "Customer name", phone: "Phone number", street: "Street address", city: "City", region: "Region", postalCode: "Postal code", country: "Country", notes: "Delivery instructions", items: "Items", product: "Product", selectProduct: "Choose a product", quantity: "Quantity", addLine: "Add an item", remove: "Remove", submit: "Save WhatsApp order", saving: "Saving…", created: "WhatsApp order saved.", invalid: "Check the fields and items. Quantities must be between 1 and 25.", denied: "Your account cannot enter orders.", failed: "Could not save the order. Stock may have changed; check that migrations are applied and products are published.", stock: "available", outOfStock: "out of stock" },
};

function localized(name: LocalizedText, locale: Locale) {
  return name[locale] || name.fr || name.en;
}

function message(state: WhatsAppOrderState, text: Copy) {
  if (typeof state === "object" && state?.status === "created") return text.created;
  if (state === "invalid") return text.invalid;
  if (state === "not_authorized") return text.denied;
  if (state === "save_failed") return text.failed;
  if (state === "out_of_stock") return text.outOfStock;
  return "";
}

export function ManualWhatsAppOrderForm({ products, locale }: { products: ProductChoice[]; locale: Locale }) {
  const [state, action, pending] = useActionState<WhatsAppOrderState, FormData>(createWhatsAppOrder, null);
  const [rows, setRows] = useState([{ key: 0 }]);
  const nextKey = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);
  const text = copy[locale];

  useEffect(() => {
    if (typeof state === "object" && state?.status === "created") {
      formRef.current?.reset();
      setRows([{ key: nextKey.current++ }]);
    }
  }, [state]);

  return (
    <section className="manual-order-card">
      <h2>{text.title}</h2>
      <p className="intro">{text.hint}</p>
      <form ref={formRef} action={action} className="order-entry-form">
        <label><span>{text.customer}</span><input name="customer_name" required maxLength={120} /></label>
        <label><span>{text.phone}</span><input name="customer_phone" required type="tel" maxLength={40} /></label>
        <label><span>{text.street}</span><input name="street" required maxLength={300} /></label>
        <label><span>{text.city}</span><input name="city" required maxLength={120} /></label>
        <label><span>{text.region}</span><input name="region" maxLength={120} /></label>
        <label><span>{text.postalCode}</span><input name="postal_code" maxLength={40} /></label>
        <label><span>{text.country}</span><input name="country" maxLength={100} /></label>
        <label className="entry-notes"><span>{text.notes}</span><textarea name="delivery_notes" maxLength={2000} rows={2} /></label>
        <fieldset className="entry-items">
          <legend>{text.items}</legend>
          {rows.map((row) => (
            <div className="entry-item-row" key={row.key}>
              <label><span>{text.product}</span><select name="product_ids" required defaultValue=""><option value="" disabled>{text.selectProduct}</option>{products.map((product) => <option key={product.id} value={product.id} disabled={product.stock_quantity !== null && Number(product.stock_quantity) === 0}>{localized(product.name_i18n, locale)}{product.sku ? ` · ${product.sku}` : ""} · {product.currency_code}{product.stock_quantity === null ? "" : ` · ${Number(product.stock_quantity) === 0 ? text.outOfStock : `${text.stock}: ${product.stock_quantity}`}`}</option>)}</select></label>
              <label><span>{text.quantity}</span><input name="quantities" type="number" min={1} max={25} step={1} defaultValue={1} required /></label>
              {rows.length > 1 && <button type="button" className="text-button" onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}>{text.remove}</button>}
            </div>
          ))}
          <button type="button" className="secondary-button" onClick={() => setRows((current) => [...current, { key: nextKey.current++ }])}>{text.addLine}</button>
        </fieldset>
        {state && <p className={typeof state === "object" ? "success-message" : "form-message"} role={typeof state === "object" ? "status" : "alert"}>{message(state, text)}</p>}
        <button className="primary-button" type="submit" disabled={pending || products.length === 0}>{pending ? text.saving : text.submit}</button>
      </form>
    </section>
  );
}
