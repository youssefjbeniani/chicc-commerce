"use client";

import Image from "next/image";
import { ChiccLogo } from "@chicc/ui";
import { formatMinorAmount, type Locale, type LocalizedText } from "@chicc/types";
import { type FormEvent, useActionState, useEffect, useState } from "react";
import { createCategory, createProduct, deleteCategory, deleteProduct, updateCategory, updateProduct, type CatalogActionState } from "./actions";

type Category = { id: string; slug: string; name_i18n: LocalizedText; is_published: boolean };
type Product = {
  id: string; slug: string; sku: string | null; category_id: string | null; stock_quantity: number | string | null;
  name_i18n: LocalizedText; description_i18n: Partial<LocalizedText> | null; image_path: string | null; image_url: string | null;
  price_minor: string | number; currency_code: string; is_published: boolean;
};
type Copy = {
  language: string; title: string; intro: string; categories: string; products: string;
  addCategory: string; addProduct: string; slug: string; nameFr: string; nameAr: string; nameEn: string;
  descriptionFr: string; descriptionAr: string; descriptionEn: string; category: string; noCategory: string;
  sku: string; price: string; currency: string; published: string; save: string; saving: string;
  saved: string; invalid: string; slugTaken: string; denied: string; failed: string; emptyCategories: string;
  emptyProducts: string; publishState: string; draft: string; priceHint: string; edit: string; update: string;
  updated: string; delete: string; deletedCategory: string; deletedProduct: string; notFound: string;
  deleteCategoryConfirm: string; deleteProductConfirm: string; deleteCategoryHint: string;
};

type StockCopy = { quantity: string; hint: string; untracked: string; available: string };
const stockCopy: Record<Locale, StockCopy> = {
  fr: { quantity: "Stock disponible", hint: "Laissez vide pour ne pas suivre le stock. Les commandes réservent les unités; les annulations les restituent.", untracked: "Stock non suivi", available: "Disponibles" },
  ar: { quantity: "المخزون المتاح", hint: "اتركه فارغاً لعدم تتبع المخزون. تحجز الطلبات الوحدات وتعيدها الإلغاءات.", untracked: "المخزون غير متتبع", available: "متاح" },
  en: { quantity: "Available stock", hint: "Leave blank to skip tracking. Orders reserve units; cancellations return them.", untracked: "Stock not tracked", available: "Available" },
};
type ImageCopy = { label: string; hint: string; remove: string; invalid: string; failed: string; cleanupPending: string };
const imageCopy: Record<Locale, ImageCopy> = {
  fr: { label: "Image du produit", hint: "JPEG, PNG ou WebP · 5 Mo maximum.", remove: "Retirer image actuelle", invalid: "Utilisez un fichier JPEG, PNG ou WebP de 5 Mo maximum.", failed: "L’image n’a pas pu être téléversée. Réessayez.", cleanupPending: "Catalogue enregistré, mais un ancien fichier image doit être nettoyé dans Supabase Storage." },
  ar: { label: "صورة المنتج", hint: "JPEG أو PNG أو WebP · بحد أقصى 5 ميغابايت.", remove: "إزالة الصورة الحالية", invalid: "استخدم صورة JPEG أو PNG أو WebP لا يتجاوز حجمها 5 ميغابايت.", failed: "تعذر رفع الصورة. حاول مرة أخرى.", cleanupPending: "تم حفظ الكتالوج، لكن يلزم تنظيف صورة قديمة في Supabase Storage." },
  en: { label: "Product image", hint: "JPEG, PNG, or WebP · maximum 5 MB.", remove: "Remove current image", invalid: "Choose a JPEG, PNG, or WebP image no larger than 5 MB.", failed: "The image could not be uploaded. Please try again.", cleanupPending: "Catalog saved, but an old image file needs cleanup in Supabase Storage." },
};

const copy: Record<Locale, Copy> = {
  fr: {
    language: "Langue", title: "Catalogue", intro: "Gérez les catégories et les produits publiés sur la vitrine.",
    categories: "Catégories", products: "Produits", addCategory: "Ajouter une catégorie", addProduct: "Ajouter un produit",
    slug: "Identifiant URL", nameFr: "Nom · Français", nameAr: "Nom · Arabe", nameEn: "Nom · Anglais",
    descriptionFr: "Description · Français (facultatif)", descriptionAr: "Description · Arabe (facultatif)", descriptionEn: "Description · Anglais (facultatif)",
    category: "Catégorie", noCategory: "Aucune catégorie", sku: "Référence SKU (facultatif)", price: "Prix", currency: "Devise (code ISO 4217)",
    published: "Publier immédiatement", save: "Enregistrer", saving: "Enregistrement…", saved: "Enregistré.", invalid: "Vérifiez les champs et les trois traductions.",
    slugTaken: "Cet identifiant URL ou SKU existe déjà.", denied: "Votre compte ne peut pas gérer le catalogue.", failed: "Enregistrement impossible. Vérifiez la migration et les autorisations.",
    emptyCategories: "Aucune catégorie pour le moment.", emptyProducts: "Aucun produit pour le moment.", publishState: "Publié", draft: "Brouillon", priceHint: "Saisissez le prix dans l’unité principale (ex. 12,50).",
    edit: "Modifier", update: "Mettre à jour", updated: "Catalogue mis à jour.", delete: "Supprimer", deletedCategory: "Catégorie supprimée. Ses produits restent dans le catalogue sans catégorie.", deletedProduct: "Produit supprimé du catalogue.", notFound: "Cette entrée n’existe plus.", deleteCategoryConfirm: "Supprimer cette catégorie ? Les produits resteront dans le catalogue sans catégorie.", deleteProductConfirm: "Supprimer ce produit du catalogue ? Les commandes précédentes conserveront leur historique.", deleteCategoryHint: "La suppression d’une catégorie ne supprime pas ses produits.",   
  },
  ar: {
    language: "اللغة", title: "الكتالوج", intro: "أدر الفئات والمنتجات المنشورة في المتجر.",
    categories: "الفئات", products: "المنتجات", addCategory: "إضافة فئة", addProduct: "إضافة منتج",
    slug: "معرّف الرابط", nameFr: "الاسم · الفرنسية", nameAr: "الاسم · العربية", nameEn: "الاسم · الإنجليزية",
    descriptionFr: "الوصف · الفرنسية (اختياري)", descriptionAr: "الوصف · العربية (اختياري)", descriptionEn: "الوصف · الإنجليزية (اختياري)",
    category: "الفئة", noCategory: "بدون فئة", sku: "رمز SKU (اختياري)", price: "السعر", currency: "العملة (رمز ISO 4217)",
    published: "انشر فوراً", save: "حفظ", saving: "جارٍ الحفظ…", saved: "تم الحفظ.", invalid: "تحقق من الحقول والترجمات الثلاث.",
    slugTaken: "معرّف الرابط أو SKU مستخدم بالفعل.", denied: "حسابك غير مخوّل لإدارة الكتالوج.", failed: "تعذر الحفظ. تحقق من الترحيل والصلاحيات.",
    emptyCategories: "لا توجد فئات بعد.", emptyProducts: "لا توجد منتجات بعد.", publishState: "منشور", draft: "مسودة", priceHint: "أدخل السعر بالوحدة الرئيسية (مثال 12.50).",
    edit: "تعديل", update: "حفظ التغييرات", updated: "تم تحديث الكتالوج.", delete: "حذف", deletedCategory: "تم حذف الفئة. بقيت منتجاتها في الكتالوج دون فئة.", deletedProduct: "تم حذف المنتج من الكتالوج.", notFound: "لم يعد هذا العنصر موجوداً.", deleteCategoryConfirm: "حذف هذه الفئة؟ ستبقى المنتجات في الكتالوج دون فئة.", deleteProductConfirm: "حذف هذا المنتج من الكتالوج؟ ستبقى الطلبات السابقة محفوظة.", deleteCategoryHint: "حذف الفئة لا يحذف منتجاتها.",   
  },
  en: {
    language: "Language", title: "Catalog", intro: "Manage categories and products published to the storefront.",
    categories: "Categories", products: "Products", addCategory: "Add a category", addProduct: "Add a product",
    slug: "URL slug", nameFr: "Name · French", nameAr: "Name · Arabic", nameEn: "Name · English",
    descriptionFr: "Description · French (optional)", descriptionAr: "Description · Arabic (optional)", descriptionEn: "Description · English (optional)",
    category: "Category", noCategory: "No category", sku: "SKU (optional)", price: "Price", currency: "Currency (ISO 4217 code)",
    published: "Publish immediately", save: "Save", saving: "Saving…", saved: "Saved.", invalid: "Check the fields and all three translations.",
    slugTaken: "That URL slug or SKU is already in use.", denied: "Your account cannot manage the catalog.", failed: "Could not save. Check that migrations and permissions are in place.",
    emptyCategories: "No categories yet.", emptyProducts: "No products yet.", publishState: "Published", draft: "Draft", priceHint: "Enter the amount in major units (for example, 12.50).",
    edit: "Edit", update: "Save changes", updated: "Catalog updated.", delete: "Delete", deletedCategory: "Category deleted. Its products remain in the catalog without a category.", deletedProduct: "Product removed from the catalog.", notFound: "That entry no longer exists.", deleteCategoryConfirm: "Delete this category? Its products will remain in the catalog without a category.", deleteProductConfirm: "Remove this product from the catalog? Existing orders will keep their saved history.", deleteCategoryHint: "Deleting a category does not delete its products.",   
  },
};

function localized(value: LocalizedText, locale: Locale): string {
  return value[locale] || value.fr || value.en;
}

function priceInputValue(amountMinor: string | number, currencyCode: string): string {
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency: currencyCode }).resolvedOptions().maximumFractionDigits ?? 2;
    const amount = BigInt(amountMinor);
    const scale = 10n ** BigInt(digits);
    const whole = amount / scale;
    if (digits === 0) return whole.toString();
    const fraction = (amount % scale).toString().padStart(digits, "0");
    return `${whole}.${fraction}`;
  } catch { return "0"; }
}

function confirmDeletion(event: FormEvent<HTMLFormElement>, prompt: string) {
  if (!window.confirm(prompt)) event.preventDefault();
}

function resultMessage(state: CatalogActionState, text: Copy, imageText: ImageCopy): string {
  if (state === "saved") return text.saved;
  if (state === "invalid") return text.invalid;
  if (state === "image_invalid") return imageText.invalid;
  if (state === "image_failed") return imageText.failed;
  if (state === "slug_taken") return text.slugTaken;
  if (state === "not_authorized") return text.denied;
  if (state === "save_failed") return text.failed;
  return "";
}

export function CatalogManager({ categories, products, catalogReady, canDelete, notice }: {
  categories: Category[]; products: Product[]; catalogReady: boolean; canDelete: boolean; notice: string | null;
}) {
  const [locale, setLocale] = useState<Locale>("fr");
  const [categoryState, categoryAction, categoryPending] = useActionState<CatalogActionState, FormData>(createCategory, null);
  const [productState, productAction, productPending] = useActionState<CatalogActionState, FormData>(createProduct, null);
  const text = copy[locale];
  const imageText = imageCopy[locale];
  const stockText = stockCopy[locale];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  const noticeText = notice === "updated" ? text.updated
    : notice === "deleted_category" ? text.deletedCategory
    : notice === "deleted_product" ? text.deletedProduct
    : notice === "slug_taken" ? text.slugTaken
    : notice === "invalid" ? text.invalid
    : notice === "not_authorized" ? text.denied
    : notice === "not_found" ? text.notFound
    : notice === "image_invalid" ? imageText.invalid : notice === "cleanup_pending" ? imageText.cleanupPending : notice === "failed" || notice === "image_failed" ? text.failed : "";

  return (
    <main className="catalog-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="dashboard-topbar">
        <a className="catalog-brand brand-lockup" href="/"><ChiccLogo className="brand-logo" /><span className="eyebrow">CHICC · ÉQUIPE</span></a>
        <label className="language-picker"><span>{text.language}</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
            <option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option>
          </select>
        </label>
      </header>
      <h1>{text.title}</h1>
      <p className="intro">{text.intro}</p>
      {noticeText && <p className={notice === "updated" || notice === "deleted_category" || notice === "deleted_product" ? "success-message" : "form-message"} role="status">{noticeText}</p>}
      {!catalogReady && <p className="form-message" role="alert">{text.failed}</p>}
      <div className="catalog-columns">
        <section>
          <h2>{text.categories}</h2>
          <form action={categoryAction} className="catalog-form">
            <h3>{text.addCategory}</h3>
            <label><span>{text.slug}</span><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} /></label>
            <label><span>{text.nameFr}</span><input name="name_fr" required maxLength={120} /></label>
            <label><span>{text.nameAr}</span><input name="name_ar" required maxLength={120} dir="rtl" /></label>
            <label><span>{text.nameEn}</span><input name="name_en" required maxLength={120} /></label>
            <label className="checkbox-row"><input name="is_published" type="checkbox" /><span>{text.published}</span></label>
            {categoryState && <p className={categoryState === "saved" ? "success-message" : "form-message"} role="status">{resultMessage(categoryState, text, imageText)}</p>}
            <button className="primary-button" disabled={!catalogReady || categoryPending}>{categoryPending ? text.saving : text.save}</button>
          </form>
          {canDelete && <p className="catalog-delete-hint">{text.deleteCategoryHint}</p>}
          <div className="catalog-list">
            {categories.length === 0 ? <p className="empty-note">{text.emptyCategories}</p> : categories.map((category) => (
              <article className="catalog-list-row catalog-managed-row" key={category.id}>
                <div><strong>{localized(category.name_i18n, locale)}</strong><small>{category.slug}</small></div>
                <span className={category.is_published ? "status-pill is-live" : "status-pill"}>{category.is_published ? text.publishState : text.draft}</span>
                <details className="catalog-edit">
                  <summary>{text.edit}</summary>
                  <form action={updateCategory} className="catalog-edit-form">
                    <input type="hidden" name="id" value={category.id} />
                    <label><span>{text.slug}</span><input name="slug" required defaultValue={category.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} /></label>
                    <label><span>{text.nameFr}</span><input name="name_fr" required defaultValue={category.name_i18n.fr} maxLength={120} /></label>
                    <label><span>{text.nameAr}</span><input name="name_ar" required defaultValue={category.name_i18n.ar} maxLength={120} dir="rtl" /></label>
                    <label><span>{text.nameEn}</span><input name="name_en" required defaultValue={category.name_i18n.en} maxLength={120} /></label>
                    <label className="checkbox-row"><input name="is_published" type="checkbox" defaultChecked={category.is_published} /><span>{text.published}</span></label>
                    <button className="secondary-button" type="submit">{text.update}</button>
                  </form>
                </details>
                {canDelete && <form action={deleteCategory} onSubmit={(event) => confirmDeletion(event, text.deleteCategoryConfirm)}>
                  <input type="hidden" name="id" value={category.id} /><button className="danger-button" type="submit">{text.delete}</button>
                </form>}
              </article>
            ))}
          </div>
        </section>
        <section>
          <h2>{text.products}</h2>
          <form action={productAction} className="catalog-form">
            <h3>{text.addProduct}</h3>
            <label><span>{text.slug}</span><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} /></label>
            <label><span>{text.category}</span><select name="category_id" defaultValue=""><option value="">{text.noCategory}</option>{categories.map((category) => <option key={category.id} value={category.id}>{localized(category.name_i18n, locale)}</option>)}</select></label>
            <label><span>{text.sku}</span><input name="sku" maxLength={80} /></label>
            <label><span>{imageText.label}</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" /><small>{imageText.hint}</small></label>
            <label><span>{text.nameFr}</span><input name="name_fr" required maxLength={120} /></label>
            <label><span>{text.nameAr}</span><input name="name_ar" required maxLength={120} dir="rtl" /></label>
            <label><span>{text.nameEn}</span><input name="name_en" required maxLength={120} /></label>
            <label><span>{text.descriptionFr}</span><textarea name="description_fr" maxLength={5000} rows={2} /></label>
            <label><span>{text.descriptionAr}</span><textarea name="description_ar" maxLength={5000} rows={2} dir="rtl" /></label>
            <label><span>{text.descriptionEn}</span><textarea name="description_en" maxLength={5000} rows={2} /></label>
            <label><span>{text.price}</span><input name="price_major" type="number" min="0" step="0.0001" required /><small>{text.priceHint}</small></label>
            <label><span>{text.currency}</span><input name="currency_code" required pattern="[A-Za-z]{3}" minLength={3} maxLength={3} placeholder="EUR" /></label>
            <label><span>{stockText.quantity}</span><input name="stock_quantity" type="number" min={0} step={1} max={Number.MAX_SAFE_INTEGER} /><small>{stockText.hint}</small></label>
            <label className="checkbox-row"><input name="is_published" type="checkbox" /><span>{text.published}</span></label>
            {productState && <p className={productState === "saved" ? "success-message" : "form-message"} role="status">{resultMessage(productState, text, imageText)}</p>}
            <button className="primary-button" disabled={!catalogReady || productPending}>{productPending ? text.saving : text.save}</button>
          </form>
          <div className="catalog-list">
            {products.length === 0 ? <p className="empty-note">{text.emptyProducts}</p> : products.map((product) => (
              <article className="catalog-list-row catalog-managed-row" key={product.id}>
                <div><strong>{localized(product.name_i18n, locale)}</strong><small>{product.slug}{product.sku ? ` · ${product.sku}` : ""} · {product.stock_quantity === null ? stockText.untracked : `${stockText.available}: ${product.stock_quantity}`}</small></div>
                <div className="catalog-product-meta"><strong>{formatMinorAmount(product.price_minor, product.currency_code, locale)}</strong><span className={product.is_published ? "status-pill is-live" : "status-pill"}>{product.is_published ? text.publishState : text.draft}</span></div>
                <details className="catalog-edit">
                  <summary>{text.edit}</summary>
                  <form action={updateProduct} className="catalog-edit-form">
                    <input type="hidden" name="id" value={product.id} />
                    {product.image_url && <div className="catalog-image-preview-frame"><Image src={product.image_url} alt={localized(product.name_i18n, locale)} fill sizes="(max-width: 760px) 100vw, 560px" className="catalog-image-preview" /></div>}
                    <label><span>{imageText.label}</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" /><small>{imageText.hint}</small></label>
                    {product.image_path && <label className="checkbox-row"><input name="remove_image" type="checkbox" /><span>{imageText.remove}</span></label>}
                    <label><span>{text.slug}</span><input name="slug" required defaultValue={product.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} /></label>
                    <label><span>{text.category}</span><select name="category_id" defaultValue={product.category_id ?? ""}><option value="">{text.noCategory}</option>{categories.map((category) => <option key={category.id} value={category.id}>{localized(category.name_i18n, locale)}</option>)}</select></label>
                    <label><span>{text.sku}</span><input name="sku" defaultValue={product.sku ?? ""} maxLength={80} /></label>
                    <label><span>{text.nameFr}</span><input name="name_fr" required defaultValue={product.name_i18n.fr} maxLength={120} /></label>
                    <label><span>{text.nameAr}</span><input name="name_ar" required defaultValue={product.name_i18n.ar} maxLength={120} dir="rtl" /></label>
                    <label><span>{text.nameEn}</span><input name="name_en" required defaultValue={product.name_i18n.en} maxLength={120} /></label>
                    <label><span>{text.descriptionFr}</span><textarea name="description_fr" defaultValue={product.description_i18n?.fr ?? ""} maxLength={5000} rows={2} /></label>
                    <label><span>{text.descriptionAr}</span><textarea name="description_ar" defaultValue={product.description_i18n?.ar ?? ""} maxLength={5000} rows={2} dir="rtl" /></label>
                    <label><span>{text.descriptionEn}</span><textarea name="description_en" defaultValue={product.description_i18n?.en ?? ""} maxLength={5000} rows={2} /></label>
                    <label><span>{text.price}</span><input name="price_major" type="number" min="0" step="0.0001" required defaultValue={priceInputValue(product.price_minor, product.currency_code)} /><small>{text.priceHint}</small></label>
                    <label><span>{text.currency}</span><input name="currency_code" required pattern="[A-Za-z]{3}" minLength={3} maxLength={3} defaultValue={product.currency_code} /></label>
                    <label><span>{stockText.quantity}</span><input name="stock_quantity" type="number" min={0} step={1} max={Number.MAX_SAFE_INTEGER} defaultValue={product.stock_quantity ?? ""} /><small>{stockText.hint}</small></label>
                    <label className="checkbox-row"><input name="is_published" type="checkbox" defaultChecked={product.is_published} /><span>{text.published}</span></label>
                    <button className="secondary-button" type="submit">{text.update}</button>
                  </form>
                </details>
                {canDelete && <form action={deleteProduct} onSubmit={(event) => confirmDeletion(event, text.deleteProductConfirm)}>
                  <input type="hidden" name="id" value={product.id} /><button className="danger-button" type="submit">{text.delete}</button>
                </form>}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
