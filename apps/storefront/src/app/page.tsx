import { StorefrontCatalog } from "@/components/storefront-catalog";
import { loadStorefrontData } from "@/lib/storefront-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CHICC — La sélection",
  description: "Découvrez la sélection CHICC.",
};

export default async function HomePage() {
  const data = await loadStorefrontData();
  return <StorefrontCatalog {...data} view="home" />;
}

