import { z } from "zod";

export const localeSchema = z.enum(["fr", "ar", "en"]);
export type ValidatedLocale = z.infer<typeof localeSchema>;

export const localizedNameSchema = z.object({
  fr: z.string().trim().min(1).max(120),
  ar: z.string().trim().min(1).max(120),
  en: z.string().trim().min(1).max(120),
});
export type ValidatedLocalizedName = z.infer<typeof localizedNameSchema>;

export const localizedTextSchema = z.object({
  fr: z.string().trim().min(1).max(5000),
  ar: z.string().trim().min(1).max(5000),
  en: z.string().trim().min(1).max(5000),
});
export type ValidatedLocalizedText = z.infer<typeof localizedTextSchema>;

const slugSchema = z.string().trim().max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const optionalLocalizedDescriptionSchema = z.object({
  fr: z.string().trim().max(5000),
  ar: z.string().trim().max(5000),
  en: z.string().trim().max(5000),
});

export const catalogCategorySchema = z.object({
  slug: slugSchema,
  nameI18n: localizedNameSchema,
  isPublished: z.boolean(),
});
export type CatalogCategoryDraft = z.infer<typeof catalogCategorySchema>;

export const catalogProductSchema = z.object({
  slug: slugSchema,
  sku: z.string().trim().max(80).optional(),
  categoryId: z.string().uuid().nullable(),
  nameI18n: localizedNameSchema,
  descriptionI18n: optionalLocalizedDescriptionSchema.nullable(),
  priceMajor: z.string().trim().max(24).regex(/^\d+(?:\.\d{1,4})?$/),
  currencyCode: z.string().trim().regex(/^[A-Z]{3}$/),
  stockQuantity: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
  isPublished: z.boolean(),
});
export type CatalogProductDraft = z.infer<typeof catalogProductSchema>;

export const staffOrderEntrySchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().min(5).max(40),
  street: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().max(120),
  postalCode: z.string().trim().max(40),
  country: z.string().trim().max(100),
  deliveryNotes: z.string().trim().max(2000),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(25) })).min(1).max(30)
    .refine((items) => new Set(items.map((item) => item.product_id)).size === items.length, "duplicate_products"),
});
export type StaffOrderEntry = z.infer<typeof staffOrderEntrySchema>;

export const staffSignInSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
});
export type StaffSignInInput = z.infer<typeof staffSignInSchema>;

export const teamProvisionSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  displayName: z.string().trim().max(120).optional(),
  role: z.enum(["staff", "delivery_worker", "manager"]),
});
export type TeamProvisionDraft = z.infer<typeof teamProvisionSchema>;
