"use client";

import Image from "next/image";
import { formatMinorAmount, type Locale, type LocalizedText } from "@chicc/types";
import { type FormEvent, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

type Category = { id: string; name_i18n: LocalizedText };
type CatalogProduct = {
  id: string;
  category_id: string | null;
  name_i18n: LocalizedText;
  description_i18n: Partial<LocalizedText> | null;
  image_url: string | null;
  is_in_stock: boolean;
  price_minor: string | number;
  currency_code: string;
};
type OrderMessage = "success" | "invalid" | "mixed_currency" | "unavailable" | "empty" | null;

const copy: Record<Locale, {
  brand: string; title: string; intro: string; language: string; empty: string; setup: string;
  categories: string; all: string; quantity: string; orderTitle: string; customerName: string;
  phone: string; street: string; city: string; region: string; postalCode: string; country: string;
  notes: string; placeOrder: string; submitting: string; orderSuccess: string; orderInvalid: string;
  mixedCurrency: string; orderUnavailable: string; chooseProduct: string; cart: string; company: string; outOfStock: string;
}> = {
  fr: {
    brand: "CHICC", title: "La sélection", intro: "Découvrez la collection CHICC.", language: "Langue", empty: "Les produits seront bientôt disponibles.", setup: "Le catalogue Supabase doit être configuré avant de publier les produits.",
    categories: "Catégories", all: "Tout voir", quantity: "Quantité", orderTitle: "Votre demande", customerName: "Nom complet", phone: "Téléphone", street: "Adresse", city: "Ville", region: "Région (facultatif)", postalCode: "Code postal (facultatif)", country: "Pays (facultatif)", notes: "Instructions de livraison (facultatif)", placeOrder: "Envoyer la demande", submitting: "Envoi…", orderSuccess: "Votre demande est reçue. L’équipe CHICC vous contactera pour confirmer la livraison.", orderInvalid: "Vérifiez vos coordonnées et l’adresse de livraison.", mixedCurrency: "Choisissez des articles dans une seule devise par commande.", orderUnavailable: "Le stock a peut-être changé. Actualisez le catalogue puis réessayez.", chooseProduct: "Choisissez au moins un article avant d’envoyer.", cart: "Articles sélectionnés", company: "Société", outOfStock: "Épuisé",
  },
  ar: {
    brand: "CHICC", title: "التشكيلة", intro: "اكتشف مجموعة CHICC.", language: "اللغة", empty: "ستتوفر المنتجات قريباً.", setup: "يجب إعداد كتالوج Supabase قبل نشر المنتجات.",
    categories: "الفئات", all: "عرض الكل", quantity: "الكمية", orderTitle: "طلبك", customerName: "الاسم الكامل", phone: "الهاتف", street: "العنوان", city: "المدينة", region: "المنطقة (اختياري)", postalCode: "الرمز البريدي (اختياري)", country: "الدولة (اختياري)", notes: "تعليمات التوصيل (اختياري)", placeOrder: "إرسال الطلب", submitting: "جارٍ الإرسال…", orderSuccess: "تم استلام طلبك. سيتواصل معك فريق CHICC لتأكيد التوصيل.", orderInvalid: "تحقق من بيانات الاتصال وعنوان التوصيل.", mixedCurrency: "اختر منتجات بعملة واحدة في كل طلب.", orderUnavailable: "ربما تغير المخزون. حدّث الكتالوج ثم حاول مجدداً.", chooseProduct: "اختر منتجاً واحداً على الأقل قبل الإرسال.", cart: "المنتجات المختارة", company: "الشركة", outOfStock: "نفد المخزون",
  },
  en: {
    brand: "CHICC", title: "The collection", intro: "Discover the CHICC collection.", language: "Language", empty: "Products will be available soon.", setup: "Configure the Supabase catalog before publishing products.",
    categories: "Categories", all: "View all", quantity: "Quantity", orderTitle: "Your order request", customerName: "Full name", phone: "Phone number", street: "Street address", city: "City", region: "Region (optional)", postalCode: "Postal code (optional)", country: "Country (optional)", notes: "Delivery instructions (optional)", placeOrder: "Send order request", submitting: "Sending…", orderSuccess: "Your request was received. The CHICC team will contact you to confirm delivery.", orderInvalid: "Check your contact details and delivery address.", mixedCurrency: "Choose items in one currency per order.", orderUnavailable: "Stock may have changed. Refresh the catalog and try again.", chooseProduct: "Choose at least one item before sending.", cart: "Selected items", company: "Company", outOfStock: "Out of stock",
  },
};

function localized(text: Partial<LocalizedText> | null | undefined, locale: Locale): string {
  return text?.[locale] || text?.fr || text?.en || "";
}

export function StorefrontCatalog({ products, categories, catalogReady }: { products: CatalogProduct[]; categories: Category[]; catalogReady: boolean }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);
  const [orderMessage, setOrderMessage] = useState<OrderMessage>(null);
  const text = copy[locale];
  const visibleProducts = categoryId ? products.filter((product) => product.category_id === categoryId) : products;
  const selectedProducts = products.filter((product) => (quantities[product.id] ?? 0) > 0);
  const currencyCodes = new Set(selectedProducts.map((product) => product.currency_code));

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  function updateQuantity(productId: string, rawValue: string) {
    const parsed = Number.parseInt(rawValue, 10);
    const quantity = Number.isInteger(parsed) ? Math.min(25, Math.max(0, parsed)) : 0;
    setQuantities((current) => ({ ...current, [productId]: quantity }));
    setOrderMessage(null);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setOrderMessage(null);
    if (selectedProducts.length === 0) {
      setOrderMessage("empty");
      return;
    }
    if (currencyCodes.size > 1) {
      setOrderMessage("mixed_currency");
      return;
    }

    setPending(true);
    try {
      const form = new FormData(formElement);
      const supabase = createBrowserClient();
      const { error } = await supabase.functions.invoke("place-website-order", {
        body: {
          customer_name: form.get("customer_name"),
          customer_phone: form.get("customer_phone"),
          delivery_address: {
            street: form.get("street"),
            city: form.get("city"),
            region: form.get("region"),
            postal_code: form.get("postal_code"),
            country: form.get("country"),
          },
          delivery_notes: form.get("delivery_notes"),
          company_website: form.get("company_website"),
          items: selectedProducts.map((product) => ({
            product_id: product.id,
            quantity: quantities[product.id],
          })),
        },
      });
      if (error) {
        setOrderMessage("unavailable");
        return;
      }
      setQuantities({});
      formElement.reset();
      setOrderMessage("success");
    } catch {
      setOrderMessage("unavailable");
    } finally {
      setPending(false);
    }
  }

  const messageText = orderMessage === "success" ? text.orderSuccess
    : orderMessage === "invalid" ? text.orderInvalid
    : orderMessage === "mixed_currency" ? text.mixedCurrency
    : orderMessage === "empty" ? text.chooseProduct
    : orderMessage === "unavailable" ? text.orderUnavailable : "";

  return (
    <main className="store-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="store-topbar">
        <span className="eyebrow">{text.brand}</span>
        <label className="language-picker"><span>{text.language}</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
            <option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option>
          </select>
        </label>
      </header>
      <section className="store-heading">
        <span className="eyebrow">E-COMMERCE</span>
        <h1>{text.title}</h1>
        <p className="intro">{text.intro}</p>
      </section>
      {!catalogReady ? <p className="catalog-empty">{text.setup}</p> : products.length === 0 ? <p className="catalog-empty">{text.empty}</p> : (
        <>
          {categories.length > 0 && <nav className="category-filters" aria-label={text.categories}>
            <button type="button" className={!categoryId ? "filter-chip is-selected" : "filter-chip"} onClick={() => setCategoryId(null)}>{text.all}</button>
            {categories.map((category) => <button type="button" key={category.id} className={categoryId === category.id ? "filter-chip is-selected" : "filter-chip"} onClick={() => setCategoryId(category.id)}>{localized(category.name_i18n, locale)}</button>)}
          </nav>}
          <section className="product-grid" aria-label={text.title}>
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-frame">
                  {product.image_url
                    ? <Image src={product.image_url} alt={localized(product.name_i18n, locale)} fill sizes="(max-width: 520px) 100vw, (max-width: 760px) 50vw, 33vw" className="product-image" />
                    : <div className="product-placeholder" aria-hidden="true">CHICC</div>}
                </div>
                <div className="product-copy">
                  <h2>{localized(product.name_i18n, locale)}</h2>
                  {product.description_i18n && <p>{localized(product.description_i18n, locale)}</p>}
                  <strong>{formatMinorAmount(product.price_minor, product.currency_code, locale)}</strong>
                  <label className="quantity-control"><span>{product.is_in_stock ? text.quantity : text.outOfStock}</span>
                    <input type="number" min={0} max={25} step={1} disabled={!product.is_in_stock} value={quantities[product.id] ?? 0} onChange={(event) => updateQuantity(product.id, event.target.value)} />
                  </label>
                </div>
              </article>
            ))}
          </section>
          {selectedProducts.length > 0 && (
            <section className="order-request-card">
              <h2>{text.orderTitle}</h2>
              <p>{text.cart}: {selectedProducts.length}</p>
              <ul className="order-summary">
                {selectedProducts.map((product) => <li key={product.id}><span>{localized(product.name_i18n, locale)} × {quantities[product.id]}</span><strong>{formatMinorAmount(Number(product.price_minor) * quantities[product.id], product.currency_code, locale)}</strong></li>)}
              </ul>
              <form onSubmit={submitOrder} className="order-request-form">
                <label><span>{text.customerName}</span><input name="customer_name" required maxLength={120} autoComplete="name" /></label>
                <label><span>{text.phone}</span><input name="customer_phone" required type="tel" maxLength={40} autoComplete="tel" /></label>
                <label><span>{text.street}</span><input name="street" required maxLength={300} autoComplete="street-address" /></label>
                <label><span>{text.city}</span><input name="city" required maxLength={120} autoComplete="address-level2" /></label>
                <label><span>{text.region}</span><input name="region" maxLength={120} autoComplete="address-level1" /></label>
                <label><span>{text.postalCode}</span><input name="postal_code" maxLength={40} autoComplete="postal-code" /></label>
                <label><span>{text.country}</span><input name="country" maxLength={100} autoComplete="country-name" /></label>
                <label><span>{text.notes}</span><textarea name="delivery_notes" maxLength={2000} rows={3} /></label>
                <label className="order-honeypot" aria-hidden="true"><span>{text.company}</span><input name="company_website" tabIndex={-1} autoComplete="off" /></label>
                {messageText && <p className={orderMessage === "success" ? "success-message" : "form-message"} role={orderMessage === "success" ? "status" : "alert"}>{messageText}</p>}
                <button className="primary-button" type="submit" disabled={pending}>{pending ? text.submitting : text.placeOrder}</button>
              </form>
            </section>
          )}
          {orderMessage && selectedProducts.length === 0 && <p className={orderMessage === "success" ? "success-message" : "form-message"} role={orderMessage === "success" ? "status" : "alert"}>{messageText}</p>}
        </>
      )}
    </main>
  );
}
