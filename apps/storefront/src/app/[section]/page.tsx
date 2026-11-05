import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontCatalog, type StorefrontView } from "@/components/storefront-catalog";
import { loadStorefrontData } from "@/lib/storefront-data";

export const dynamic = "force-dynamic";

const sections: Record<string, { view: StorefrontView; title: string; description: string }> = {
  homme: { view: "category:homme", title: "Homme", description: "La sélection CHICC pour homme." },
  femme: { view: "category:femme", title: "Femme", description: "La sélection CHICC pour femme." },
  packs: { view: "packs", title: "Packs", description: "Composez votre duo ou votre trio CHICC." },
  about: { view: "about", title: "À propos de CHICC", description: "Découvrez l’univers CHICC." },
  collection: { view: "collection", title: "La collection CHICC", description: "Découvrez tous les parfums CHICC." },
};

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const page = sections[section];
  return page ? { title: `${page.title} — CHICC`, description: page.description } : {};
}

export default async function StoreSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = sections[section];
  if (!page) notFound();

  const data = await loadStorefrontData();
  return <StorefrontCatalog {...data} view={page.view} />;
}
