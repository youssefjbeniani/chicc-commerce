import type { LocalizedText } from "@chicc/types";
import { StorefrontCatalog } from "@/components/storefront-catalog";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CHICC — La sélection",
  description: "Découvrez la sélection CHICC.",
};

type Category = { id: string; name_i18n: LocalizedText };
type CatalogProduct = {
  id: string; category_id: string | null; name_i18n: LocalizedText;
  description_i18n: Partial<LocalizedText> | null; image_url: string | null; is_in_stock: boolean; price_minor: string | number; currency_code: string;
};

export default async function HomePage() {
  if (!hasSupabaseConfig()) return <StorefrontCatalog products={[]} categories={[]} catalogReady={false} />;

  const supabase = createClient();
  const [productResult, categoryResult] = await Promise.all([
    supabase.from("products").select("id, category_id, name_i18n, description_i18n, image_path, is_in_stock, price_minor, currency_code").eq("is_published", true).order("sort_order").order("slug"),
    supabase.from("catalog_categories").select("id, name_i18n").eq("is_published", true).order("sort_order").order("slug"),
  ]);
  const catalogReady = !productResult.error && !categoryResult.error;
  const products = catalogReady ? (productResult.data ?? []).map((product) => ({
    ...product,
    image_url: product.image_path
      ? supabase.storage.from("chicc-product-images").getPublicUrl(product.image_path).data.publicUrl
      : null,
  })) as CatalogProduct[] : [];

  return (
    <StorefrontCatalog
      products={products}
      categories={catalogReady ? (categoryResult.data ?? []) as Category[] : []}
      catalogReady={catalogReady}
    />
  );
}

