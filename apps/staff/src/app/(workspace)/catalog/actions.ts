"use server";

import { catalogCategorySchema, catalogProductSchema } from "@chicc/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/require-internal-user";
import { createClient } from "@/lib/supabase/server";

export type CatalogActionState = "saved" | "invalid" | "slug_taken" | "not_authorized" | "save_failed" | null;

type StockQuantityInput = { valid: true; value: number | null } | { valid: false };
function parseStockQuantity(value: FormDataEntryValue | null): StockQuantityInput {
  if (value === null || typeof value !== "string") return { valid: false };
  const trimmed = value.trim();
  if (trimmed === "") return { valid: true, value: null };
  const quantity = Number(trimmed);
  return Number.isSafeInteger(quantity) && quantity >= 0
    ? { valid: true, value: quantity }
    : { valid: false };
}
function canManageCatalog(role: string): boolean {
  return role === "staff" || role === "manager";
}

function toMinorUnits(priceMajor: string, currencyCode: string): number | null {
  try {
    const formatter = new Intl.NumberFormat("en", { style: "currency", currency: currencyCode });
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    const [wholePart, fractionPart = ""] = priceMajor.split(".");
    let normalizedFraction = fractionPart;
    while (normalizedFraction.length > fractionDigits && normalizedFraction.endsWith("0")) {
      normalizedFraction = normalizedFraction.slice(0, -1);
    }
    if (normalizedFraction.length > fractionDigits) return null;
    const scale = 10n ** BigInt(fractionDigits);
    const fraction = (normalizedFraction + "0".repeat(fractionDigits)).slice(0, fractionDigits) || "0";
    const minor = BigInt(wholePart) * scale + BigInt(fraction);
    if (minor < 0n || minor > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    return Number(minor);
  } catch {
    return null;
  }
}

export async function createCategory(_previous: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const user = await requireInternalUser();
  if (!canManageCatalog(user.role)) return "not_authorized";

  const parsed = catalogCategorySchema.safeParse({
    slug: formData.get("slug"),
    nameI18n: { fr: formData.get("name_fr"), ar: formData.get("name_ar"), en: formData.get("name_en") },
    isPublished: formData.get("is_published") === "on",
  });
  if (!parsed.success) return "invalid";

  const supabase = await createClient();
  const { error } = await supabase.from("catalog_categories").insert({
    slug: parsed.data.slug,
    name_i18n: parsed.data.nameI18n,
    is_published: parsed.data.isPublished,
  });
  if (error) return error.code === "23505" ? "slug_taken" : "save_failed";

  revalidatePath("/catalog");
  revalidatePath("/");
  return "saved";
}

export async function createProduct(_previous: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const user = await requireInternalUser();
  if (!canManageCatalog(user.role)) return "not_authorized";

  const descriptionValues = {
    fr: String(formData.get("description_fr") ?? "").trim(),
    ar: String(formData.get("description_ar") ?? "").trim(),
    en: String(formData.get("description_en") ?? "").trim(),
  };
  const hasAnyDescription = Object.values(descriptionValues).some(Boolean);
  const stockQuantity = parseStockQuantity(formData.get("stock_quantity"));
  if (!stockQuantity.valid) return "invalid";
  const parsed = catalogProductSchema.safeParse({
    slug: formData.get("slug"),
    sku: String(formData.get("sku") ?? "").trim() || undefined,
    categoryId: String(formData.get("category_id") ?? "") || null,
    nameI18n: { fr: formData.get("name_fr"), ar: formData.get("name_ar"), en: formData.get("name_en") },
    descriptionI18n: hasAnyDescription ? descriptionValues : null,
    priceMajor: formData.get("price_major"),
    currencyCode: String(formData.get("currency_code") ?? "").trim().toUpperCase(),
    stockQuantity: stockQuantity.value,
    isPublished: formData.get("is_published") === "on",
  });
  if (!parsed.success) return "invalid";

  const priceMinor = toMinorUnits(parsed.data.priceMajor, parsed.data.currencyCode);
  if (priceMinor === null) return "invalid";

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    slug: parsed.data.slug,
    sku: parsed.data.sku || null,
    category_id: parsed.data.categoryId,
    name_i18n: parsed.data.nameI18n,
    description_i18n: parsed.data.descriptionI18n,
    price_minor: priceMinor,
    currency_code: parsed.data.currencyCode,
    stock_quantity: parsed.data.stockQuantity,
    is_published: parsed.data.isPublished,
  });
  if (error) return error.code === "23505" ? "slug_taken" : "save_failed";

  revalidatePath("/catalog");
  revalidatePath("/");
  return "saved";
}


function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function updateCategory(formData: FormData): Promise<void> {
  const user = await requireInternalUser();
  if (!canManageCatalog(user.role)) redirect("/catalog?notice=not_authorized");
  const id = String(formData.get("id") ?? "");
  if (!validUuid(id)) redirect("/catalog?notice=failed");
  const parsed = catalogCategorySchema.safeParse({
    slug: formData.get("slug"),
    nameI18n: { fr: formData.get("name_fr"), ar: formData.get("name_ar"), en: formData.get("name_en") },
    isPublished: formData.get("is_published") === "on",
  });
  if (!parsed.success) redirect("/catalog?notice=invalid");

  const supabase = await createClient();
  const { data, error } = await supabase.from("catalog_categories").update({
    slug: parsed.data.slug,
    name_i18n: parsed.data.nameI18n,
    is_published: parsed.data.isPublished,
  }).eq("id", id).select("id").maybeSingle();
  if (error) redirect(error.code === "23505" ? "/catalog?notice=slug_taken" : "/catalog?notice=failed");
  if (!data) redirect("/catalog?notice=not_found");
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect("/catalog?notice=updated");
}

const productImageBucket = "chicc-product-images";
const maxProductImageBytes = 5 * 1024 * 1024;

type ProductImageExtension = "jpg" | "png" | "webp";

async function detectProductImageExtension(file: File): Promise<ProductImageExtension | null> {
  if (file.size < 12 || file.size > maxProductImageBytes) return null;
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = file.type === "image/png" && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const webp = file.type === "image/webp" && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return jpeg ? "jpg" : png ? "png" : webp ? "webp" : null;
}

function isProductImagePath(path: string | null, productId: string): path is string {
  return path !== null && path.startsWith(`${productId}/`)
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(path);
}

export async function updateProduct(formData: FormData): Promise<void> {
  const user = await requireInternalUser();
  if (!canManageCatalog(user.role)) redirect("/catalog?notice=not_authorized");
  const id = String(formData.get("id") ?? "");
  if (!validUuid(id)) redirect("/catalog?notice=failed");

  const imageEntry = formData.get("image");
  const imageFile = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;
  if (typeof imageEntry === "string" && imageEntry) redirect("/catalog?notice=image_invalid");
  const removeImage = formData.get("remove_image") === "on";
  if (imageFile && removeImage) redirect("/catalog?notice=image_invalid");
  const imageExtension = imageFile ? await detectProductImageExtension(imageFile) : null;
  if (imageFile && !imageExtension) redirect("/catalog?notice=image_invalid");

  const stockQuantity = parseStockQuantity(formData.get("stock_quantity"));
  if (!stockQuantity.valid) redirect("/catalog?notice=invalid");

  const descriptionValues = {
    fr: String(formData.get("description_fr") ?? "").trim(),
    ar: String(formData.get("description_ar") ?? "").trim(),
    en: String(formData.get("description_en") ?? "").trim(),
  };
  const hasAnyDescription = Object.values(descriptionValues).some(Boolean);
  const parsed = catalogProductSchema.safeParse({
    slug: formData.get("slug"),
    sku: String(formData.get("sku") ?? "").trim() || undefined,
    categoryId: String(formData.get("category_id") ?? "") || null,
    nameI18n: { fr: formData.get("name_fr"), ar: formData.get("name_ar"), en: formData.get("name_en") },
    descriptionI18n: hasAnyDescription ? descriptionValues : null,
    priceMajor: formData.get("price_major"),
    currencyCode: String(formData.get("currency_code") ?? "").trim().toUpperCase(),
    stockQuantity: stockQuantity.value,
    isPublished: formData.get("is_published") === "on",
  });
  if (!parsed.success) redirect("/catalog?notice=invalid");
  const priceMinor = toMinorUnits(parsed.data.priceMajor, parsed.data.currencyCode);
  if (priceMinor === null) redirect("/catalog?notice=invalid");

  const supabase = await createClient();
  const { data: existing, error: lookupError } = await supabase.from("products").select("image_path").eq("id", id).maybeSingle();
  if (lookupError) redirect("/catalog?notice=failed");
  if (!existing) redirect("/catalog?notice=not_found");

  let uploadedImagePath: string | null = null;
  if (imageFile && imageExtension) {
    uploadedImagePath = `${id}/${crypto.randomUUID()}.${imageExtension}`;
    const { error: uploadError } = await supabase.storage.from(productImageBucket).upload(uploadedImagePath, imageFile, {
      contentType: imageFile.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) redirect("/catalog?notice=image_failed");
  }

  const imagePath = uploadedImagePath ?? (removeImage ? null : existing.image_path);
  const { data, error } = await supabase.from("products").update({
    slug: parsed.data.slug,
    sku: parsed.data.sku || null,
    category_id: parsed.data.categoryId,
    name_i18n: parsed.data.nameI18n,
    description_i18n: parsed.data.descriptionI18n,
    price_minor: priceMinor,
    currency_code: parsed.data.currencyCode,
    stock_quantity: parsed.data.stockQuantity,
    is_published: parsed.data.isPublished,
    image_path: imagePath,
  }).eq("id", id).select("id").maybeSingle();
  if (error || !data) {
    if (uploadedImagePath) await supabase.storage.from(productImageBucket).remove([uploadedImagePath]);
    if (!data && !error) redirect("/catalog?notice=not_found");
    redirect(error?.code === "23505" ? "/catalog?notice=slug_taken" : "/catalog?notice=failed");
  }

  let cleanupFailed = false;
  if (existing.image_path && existing.image_path !== imagePath) {
    const { error: cleanupError } = await supabase.storage.from(productImageBucket).remove([existing.image_path]);
    cleanupFailed = Boolean(cleanupError);
  }
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect(cleanupFailed ? "/catalog?notice=cleanup_pending" : "/catalog?notice=updated");
}
export async function deleteCategory(formData: FormData): Promise<void> {
  const user = await requireInternalUser();
  if (user.role !== "manager") redirect("/catalog?notice=not_authorized");
  const id = String(formData.get("id") ?? "");
  if (!validUuid(id)) redirect("/catalog?notice=failed");
  const supabase = await createClient();
  const { data, error } = await supabase.from("catalog_categories").delete().eq("id", id).select("id").maybeSingle();
  if (error) redirect("/catalog?notice=failed");
  if (!data) redirect("/catalog?notice=not_found");
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect("/catalog?notice=deleted_category");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const user = await requireInternalUser();
  if (user.role !== "manager") redirect("/catalog?notice=not_authorized");
  const id = String(formData.get("id") ?? "");
  if (!validUuid(id)) redirect("/catalog?notice=failed");
  const supabase = await createClient();
  const { data: existing, error: lookupError } = await supabase.from("products").select("image_path").eq("id", id).maybeSingle();
  if (lookupError) redirect("/catalog?notice=failed");
  if (!existing) redirect("/catalog?notice=not_found");
  const { data, error } = await supabase.from("products").delete().eq("id", id).select("id").maybeSingle();
  if (error) redirect("/catalog?notice=failed");
  if (!data) redirect("/catalog?notice=not_found");
  let cleanupFailed = false;
  if (existing.image_path) {
    const { error: cleanupError } = await supabase.storage.from(productImageBucket).remove([existing.image_path]);
    cleanupFailed = Boolean(cleanupError);
  }
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect(cleanupFailed ? "/catalog?notice=cleanup_pending" : "/catalog?notice=deleted_product");
}
