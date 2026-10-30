export type Locale = "fr" | "ar" | "en";

export type Direction = "ltr" | "rtl";

export const localeDirection: Record<Locale, Direction> = {
  fr: "ltr",
  ar: "rtl",
  en: "ltr",
};

export type LocalizedText = Record<Locale, string>;

export type ChiccAccountRole = "customer" | "staff" | "delivery_worker" | "manager";
export type InternalAccountRole = Exclude<ChiccAccountRole, "customer">;

export type OrderChannel = "website" | "whatsapp";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export function isInternalRole(role: string | null | undefined): role is InternalAccountRole {
  return role === "staff" || role === "delivery_worker" || role === "manager";
}

export function formatMinorAmount(amountMinor: string | number, currencyCode: string, locale: Locale): string {
  const amount = Number(amountMinor);
  if (!Number.isSafeInteger(amount) || amount < 0) return "";
  try {
    const formatter = new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode });
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    return formatter.format(amount / 10 ** fractionDigits);
  } catch {
    return "";
  }
}
