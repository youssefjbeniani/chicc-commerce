import type { LocalizedText } from "@chicc/types";
import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/require-internal-user";
import { createClient } from "@/lib/supabase/server";
import { CatalogManager } from "./catalog-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catalog · CHICC Staff" };

type Category = { id: string; slug: string; name_i18n: LocalizedText; is_published: boolean };
type ProductRow = {
  id: string; slug: string; sku: string | null; category_id: string | null;
  name_i18n: LocalizedText; description_i18n: Partial<LocalizedText> | null;
  image_path: string | null; stock_quantity: number | string | null; price_minor: string | number; currency_code: string; is_published: boolean;
};
type Product = ProductRow & { image_url: string | null };
type CatalogPageProps = { searchParams: Promise<{ notice?: string }> };

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const user = await requireInternalUser();
  if (user.role !== "staff" && user.role !== "manager") redirect("/");

  const supabase = await createClient();
  const [categoryResult, productResult, params] = await Promise.all([
    supabase.from("catalog_categories").select("id, slug, name_i18n, is_published").order("sort_order").order("slug"),
    supabase.from("products").select("id, slug, sku, category_id, name_i18n, description_i18n, image_path, stock_quantity, price_minor, currency_code, is_published").order("created_at", { ascending: false }),
    searchParams,
  ]);
  const catalogReady = !categoryResult.error && !productResult.error;
  const rows = catalogReady ? (productResult.data ?? []) as ProductRow[] : [];
  const products: Product[] = rows.map((product) => ({
    ...product,
    image_url: product.image_path ? supabase.storage.from("chicc-product-images").getPublicUrl(product.image_path).data.publicUrl : null,
  }));

  return (
    <CatalogManager
      categories={catalogReady ? (categoryResult.data ?? []) as Category[] : []}
      products={products}
      catalogReady={catalogReady}
      canDelete={user.role === "manager"}
      notice={params.notice ?? null}
    />
  );
}
