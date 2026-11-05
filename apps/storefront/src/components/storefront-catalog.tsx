"use client";

import Image from "next/image";
import Link from "next/link";
import { type Locale, type LocalizedText, formatMinorAmount } from "@chicc/types";
import { ChiccIcon } from "@chicc/ui";
import { type FormEvent, useEffect, useState } from "react";
import type { StoreCategory, StoreProduct } from "@/lib/storefront-data";
import { createBrowserClient } from "@/lib/supabase/browser";

export type StorefrontView = "home" | "collection" | "packs" | "about" | "category:homme" | "category:femme";

type Copy = {
  brand: string; language: string; announcement: string; menu: string; close: string;
  men: string; women: string; packs: string; about: string; collection: string;
  heroEyebrow: string; heroTitle: string; heroText: string; aboutLink: string;
  introEyebrow: string; introTitle: string; introText: string;
  categoriesTitle: string; featuredTitle: string; seeAll: string;
  collectionTitle: string; categoryIntro: string;
  viewProduct: string; outOfStock: string; inStock: string; details: string; deliveryNote: string;
  empty: string; setup: string;
  packEyebrow: string; packTitle: string; packIntro: string; packDuo: string; packTrio: string;
  packDuoNote: string; packTrioNote: string; packChoose: string; packSelected: string;
  packRemaining: string; packTotal: string; packDelivery: string; packReady: string; packContinue: string;
  packBestValue: string; packSave: string; packFreeDelivery: string; packPickTwo: string; packPickThree: string;
  packBack: string; packToOrder: string; packOrderTitle: string; packOrderIntro: string;
  packCustomerName: string; packPhone: string; packStreet: string; packRegion: string; packChooseRegion: string;
  packPlaceOrder: string; packSubmitting: string; packSuccess: string; packFailure: string;
  aboutEyebrow: string; aboutTitle: string; aboutText: string; aboutSecondTitle: string;
  aboutSecondText: string; aboutValueOne: string; aboutValueOneText: string;
  aboutValueTwo: string; aboutValueTwoText: string; aboutValueThree: string; aboutValueThreeText: string;
  trustTeam: string; trustStock: string; trustDelivery: string; trustPayment: string;
};

const copy: Record<Locale, Copy> = {
  fr: {
    brand: "CHICC", language: "Langue", announcement: "L’équipe CHICC vous accompagne pour chaque commande.", menu: "Menu", close: "Fermer",
    men: "Homme", women: "Femme", packs: "Packs", about: "À propos", collection: "Tous les parfums",
    heroEyebrow: "CHICC · LE PARFUM AU QUOTIDIEN", heroTitle: "trouvez votre signature",
    heroText: "Des parfums choisis avec soin, pour les jours ordinaires comme pour les moments à part.", aboutLink: "À propos de CHICC",
    introEyebrow: "L’UNIVERS CHICC", introTitle: "un parfum, une présence",
    introText: "Une sélection de parfums pour accompagner vos instants, vos envies et votre signature.",
    categoriesTitle: "choisissez votre univers", featuredTitle: "à découvrir", seeAll: "Voir toute la collection",
    collectionTitle: "la collection", categoryIntro: "Explorez notre sélection et trouvez le parfum qui vous ressemble.",
    viewProduct: "Découvrir le parfum", outOfStock: "Épuisé", inStock: "Disponible", details: "Voir les détails",
    deliveryNote: "Livraison confirmée avec vous", empty: "Les produits seront bientôt disponibles.", setup: "Le catalogue est momentanément indisponible.",
    packEyebrow: "CHICC · À COMPOSER", packTitle: "composez votre pack", packIntro: "Choisissez vos parfums préférés et créez un duo ou un trio à votre image.",
    packDuo: "Le duo", packTrio: "Le trio", packDuoNote: "2 parfums · à composer", packTrioNote: "3 parfums · à composer",
    packChoose: "Choisissez vos parfums", packSelected: "sélectionnés", packRemaining: "encore à choisir", packTotal: "Total estimé",
    packDelivery: "Livraison confirmée avec vous", packReady: "Votre sélection est prête.", packContinue: "Voir la collection",
    packBestValue: "MEILLEUR PRIX", packSave: "Économisez", packFreeDelivery: "Livraison gratuite", packPickTwo: "CHOISIR MES 2", packPickThree: "CHOISIR MES 3",
    packBack: "Retour aux packs", packToOrder: "Continuer vers la commande", packOrderTitle: "Vos coordonnées", packOrderIntro: "Nous vous contactons pour confirmer votre commande et la livraison.",
    packCustomerName: "Nom complet", packPhone: "Téléphone", packStreet: "Adresse", packRegion: "Gouvernorat", packChooseRegion: "Sélectionner un gouvernorat",
    packPlaceOrder: "Passer la commande", packSubmitting: "Envoi…", packSuccess: "Votre commande a été reçue. L’équipe CHICC vous contactera pour confirmer la livraison.", packFailure: "Impossible d’envoyer la commande. Vérifiez votre sélection et réessayez.",
    aboutEyebrow: "CHICC · NOTRE HISTOIRE", aboutTitle: "le parfum, à votre façon",
    aboutText: "CHICC est née d’une envie simple : rendre le choix d’un parfum plus personnel. Nous réunissons des senteurs à porter selon vos envies, vos journées et les moments qui comptent.",
    aboutSecondTitle: "une sélection pensée pour vous",
    aboutSecondText: "Chaque parfum raconte une humeur. Notre collection vous invite à explorer différentes notes et à trouver celles qui vous accompagnent naturellement.",
    aboutValueOne: "Le choix", aboutValueOneText: "Une sélection variée pour suivre vos envies.",
    aboutValueTwo: "Le conseil", aboutValueTwoText: "Une équipe disponible pour vous accompagner.",
    aboutValueThree: "La confiance", aboutValueThreeText: "Nous confirmons avec vous la disponibilité et la livraison.",
    trustTeam: "Commande confirmée par l’équipe", trustStock: "Disponibilité affichée", trustDelivery: "Livraison confirmée avec vous", trustPayment: "Aucun paiement en ligne",
  },
  ar: {
    brand: "CHICC", language: "اللغة", announcement: "فريق CHICC معك في كل طلب.", menu: "القائمة", close: "إغلاق",
    men: "رجالي", women: "نسائي", packs: "الباقات", about: "من نحن", collection: "كل العطور",
    heroEyebrow: "CHICC · عطر لكل يوم", heroTitle: "اكتشف عطرك المميز",
    heroText: "عطور مختارة بعناية للأيام العادية واللحظات الخاصة.", aboutLink: "اكتشف CHICC",
    introEyebrow: "عالم CHICC", introTitle: "عطر يعبّر عنك",
    introText: "مجموعة عطور ترافق لحظاتك واختياراتك وبصمتك الخاصة.",
    categoriesTitle: "اختر عالمك", featuredTitle: "اكتشف عطورنا", seeAll: "عرض المجموعة كاملة",
    collectionTitle: "مجموعة العطور", categoryIntro: "اكتشف عطورنا واختر ما يناسبك.",
    viewProduct: "اكتشف العطر", outOfStock: "نفد المخزون", inStock: "متوفر", details: "عرض التفاصيل",
    deliveryNote: "يتم تأكيد التوصيل معك", empty: "ستتوفر المنتجات قريباً.", setup: "كتالوج العطور غير متاح حالياً.",
    packEyebrow: "CHICC · اختر عطرك", packTitle: "كوّن مجموعتك", packIntro: "اختر العطور التي تحبها وابتكر ثنائياً أو ثلاثياً يناسبك.",
    packDuo: "الثنائي", packTrio: "الثلاثي", packDuoNote: "عطران · اخترهما بنفسك", packTrioNote: "ثلاثة عطور · اخترها بنفسك",
    packChoose: "اختر عطورك", packSelected: "مختارة", packRemaining: "متبقية للاختيار", packTotal: "المجموع التقديري",
    packDelivery: "يتم تأكيد التوصيل معك", packReady: "اختياراتك جاهزة.", packContinue: "اكتشف المجموعة",
    packBestValue: "أفضل قيمة", packSave: "وفّر", packFreeDelivery: "توصيل مجاني", packPickTwo: "اختر عطريْن", packPickThree: "اختر ثلاثة عطور",
    packBack: "العودة إلى الباقات", packToOrder: "متابعة إلى الطلب", packOrderTitle: "بياناتك", packOrderIntro: "سنتواصل معك لتأكيد الطلب والتوصيل.",
    packCustomerName: "الاسم الكامل", packPhone: "الهاتف", packStreet: "العنوان", packRegion: "الولاية", packChooseRegion: "اختر ولاية",
    packPlaceOrder: "إرسال الطلب", packSubmitting: "جارٍ الإرسال…", packSuccess: "تم استلام طلبك. سيتواصل معك فريق CHICC لتأكيد التوصيل.", packFailure: "تعذر إرسال الطلب. تحقق من اختياراتك وحاول مجدداً.",
    aboutEyebrow: "CHICC · قصتنا", aboutTitle: "العطر على طريقتك",
    aboutText: "بدأت CHICC بفكرة بسيطة: أن يكون اختيار العطر أقرب إلى شخصيتك. نجمع عطوراً تناسب اختياراتك وأيامك ولحظاتك المهمة.",
    aboutSecondTitle: "اختيارات صُممت لك",
    aboutSecondText: "لكل عطر إحساسه الخاص. تدعوك مجموعتنا لاكتشاف روائح مختلفة والعثور على ما يرافقك بطبيعية.",
    aboutValueOne: "التنوع", aboutValueOneText: "اختيارات مختلفة تناسب أذواقك.",
    aboutValueTwo: "المساعدة", aboutValueTwoText: "فريقنا متاح لمساعدتك.",
    aboutValueThree: "الثقة", aboutValueThreeText: "نؤكد معك التوفر وتفاصيل التوصيل.",
    trustTeam: "فريق CHICC يؤكد الطلب", trustStock: "التوفر موضح", trustDelivery: "تأكيد التوصيل معك", trustPayment: "لا يوجد دفع عبر الإنترنت",
  },
  en: {
    brand: "CHICC", language: "Language", announcement: "The CHICC team is here to help with every order.", menu: "Menu", close: "Close",
    men: "Men", women: "Women", packs: "Packs", about: "About us", collection: "All fragrances",
    heroEyebrow: "CHICC · FRAGRANCE FOR EVERY DAY", heroTitle: "find your signature",
    heroText: "Scents chosen with care for everyday moments and the ones worth remembering.", aboutLink: "About CHICC",
    introEyebrow: "THE CHICC WORLD", introTitle: "a scent, a presence",
    introText: "A fragrance selection to accompany your moments, your moods, and your signature.",
    categoriesTitle: "find your kind of scent", featuredTitle: "worth discovering", seeAll: "See the full collection",
    collectionTitle: "the collection", categoryIntro: "Explore our selection and find the scent that feels like you.",
    viewProduct: "Discover this scent", outOfStock: "Out of stock", inStock: "In stock", details: "See details",
    deliveryNote: "Delivery details confirmed with you", empty: "Products will be available soon.", setup: "The fragrance collection is temporarily unavailable.",
    packEyebrow: "CHICC · MAKE IT YOURS", packTitle: "build your pack", packIntro: "Choose your favourite scents and put together a duo or trio that feels like you.",
    packDuo: "The duo", packTrio: "The trio", packDuoNote: "2 scents · picked by you", packTrioNote: "3 scents · picked by you",
    packChoose: "Choose your scents", packSelected: "selected", packRemaining: "left to choose", packTotal: "Estimated total",
    packDelivery: "Delivery details confirmed with you", packReady: "Your selection is ready.", packContinue: "Explore the collection",
    packBestValue: "BEST VALUE", packSave: "Save", packFreeDelivery: "Free delivery", packPickTwo: "PICK MY 2", packPickThree: "PICK MY 3",
    packBack: "Back to packs", packToOrder: "Continue to order", packOrderTitle: "Your details", packOrderIntro: "We’ll contact you to confirm your order and delivery.",
    packCustomerName: "Full name", packPhone: "Phone number", packStreet: "Street address", packRegion: "Governorate", packChooseRegion: "Choose a governorate",
    packPlaceOrder: "Place order", packSubmitting: "Sending…", packSuccess: "Your order was received. The CHICC team will contact you to confirm delivery.", packFailure: "We couldn’t send your order. Check your selection and try again.",
    aboutEyebrow: "CHICC · OUR STORY", aboutTitle: "fragrance, your way",
    aboutText: "CHICC began with a simple idea: choosing a fragrance should feel personal. We bring together scents for your moods, your days, and the moments that matter.",
    aboutSecondTitle: "a selection made for you",
    aboutSecondText: "Every fragrance carries a feeling. Our collection invites you to explore different notes and find the ones that feel natural to you.",
    aboutValueOne: "Choice", aboutValueOneText: "A varied selection for every mood.",
    aboutValueTwo: "Care", aboutValueTwoText: "Our team is here to help you choose.",
    aboutValueThree: "Confidence", aboutValueThreeText: "We confirm availability and delivery with you.",
    trustTeam: "Orders confirmed by CHICC", trustStock: "Availability shown", trustDelivery: "Delivery details confirmed with you", trustPayment: "No online payments",
  },
};

export type StoreGovernorate = { code: string; fr: string; ar: string; en: string };
export const storeGovernorates: StoreGovernorate[] = [
  { code: "ariana", fr: "Ariana", ar: "أريانة", en: "Ariana" }, { code: "beja", fr: "Béja", ar: "باجة", en: "Beja" },
  { code: "ben_arous", fr: "Ben Arous", ar: "بن عروس", en: "Ben Arous" }, { code: "bizerte", fr: "Bizerte", ar: "بنزرت", en: "Bizerte" },
  { code: "gabes", fr: "Gabès", ar: "قابس", en: "Gabes" }, { code: "gafsa", fr: "Gafsa", ar: "قفصة", en: "Gafsa" },
  { code: "jendouba", fr: "Jendouba", ar: "جندوبة", en: "Jendouba" }, { code: "kairouan", fr: "Kairouan", ar: "القيروان", en: "Kairouan" },
  { code: "kasserine", fr: "Kasserine", ar: "القصرين", en: "Kasserine" }, { code: "kebili", fr: "Kébili", ar: "قبلي", en: "Kebili" },
  { code: "kef", fr: "Le Kef", ar: "الكاف", en: "Kef" }, { code: "mahdia", fr: "Mahdia", ar: "المهدية", en: "Mahdia" },
  { code: "manouba", fr: "Manouba", ar: "منوبة", en: "Manouba" }, { code: "medenine", fr: "Médenine", ar: "مدنين", en: "Medenine" },
  { code: "monastir", fr: "Monastir", ar: "المنستير", en: "Monastir" }, { code: "nabeul", fr: "Nabeul", ar: "نابل", en: "Nabeul" },
  { code: "sfax", fr: "Sfax", ar: "صفاقس", en: "Sfax" }, { code: "sidi_bouzid", fr: "Sidi Bouzid", ar: "سيدي بوزيد", en: "Sidi Bouzid" },
  { code: "siliana", fr: "Siliana", ar: "سليانة", en: "Siliana" }, { code: "sousse", fr: "Sousse", ar: "سوسة", en: "Sousse" },
  { code: "tataouine", fr: "Tataouine", ar: "تطاوين", en: "Tataouine" }, { code: "tozeur", fr: "Tozeur", ar: "توزر", en: "Tozeur" },
  { code: "tunis", fr: "Tunis", ar: "تونس", en: "Tunis" }, { code: "zaghouan", fr: "Zaghouan", ar: "زغوان", en: "Zaghouan" },
];

type PackStep = "offers" | "selection" | "checkout" | "success";

function localized(text: Partial<LocalizedText> | null | undefined, locale: Locale) {
  return text?.[locale] || text?.fr || text?.en || "";
}

const localeStorageKey = "chicc-language";

export function useStoreLocale() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    try {
      const savedLocale = window.localStorage.getItem(localeStorageKey);
      if (savedLocale === "fr" || savedLocale === "ar" || savedLocale === "en") {
        setLocale(savedLocale);
      }
    } catch {
      // Keep the default French locale when storage is unavailable.
    }
    setLocaleReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    if (!localeReady) return;

    try {
      window.localStorage.setItem(localeStorageKey, locale);
    } catch {
      // The selector still works for this page when storage is unavailable.
    }
  }, [locale, localeReady]);

  return [locale, setLocale] as const;
}

export function formatProductName(name: string, locale: Locale) {
  if (locale === "ar") return name;
  return name.toLocaleLowerCase(locale).replace(/(^|[\s-])(\p{L})/gu, (_, separator: string, initial: string) => `${separator}${initial.toLocaleUpperCase(locale)}`);
}

function matchesCategory(category: StoreCategory, key: "homme" | "femme") {
  return category.slug === key
    || category.slug === `${key}-parfums`
    || localized(category.name_i18n, "fr").trim().toLocaleLowerCase("fr") === key;
}

type StoreHeaderLabels = Pick<Copy, "brand" | "language" | "announcement" | "menu" | "close"> & {
  men?: string; women?: string; packs?: string; about?: string; collection?: string;
  categories?: string;
  all?: string;
};

export function StoreHeader({ locale, onLocaleChange, labels }: {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  labels: StoreHeaderLabels;
}) {
  const fallbacks = locale === "fr"
    ? { men: "Homme", women: "Femme", packs: "Packs", about: "À propos", collection: "Tous les parfums" }
    : locale === "ar"
      ? { men: "رجالي", women: "نسائي", packs: "الباقات", about: "من نحن", collection: "كل العطور" }
      : { men: "Men", women: "Women", packs: "Packs", about: "About us", collection: "All fragrances" };
  const links = [
    ["/homme", labels.men ?? fallbacks.men],
    ["/femme", labels.women ?? fallbacks.women],
    ["/packs", labels.packs ?? fallbacks.packs],
    ["/about", labels.about ?? fallbacks.about],
  ];
  const collectionLabel = labels.collection ?? labels.all ?? fallbacks.collection;

  return <>
    <div className="announcement-bar">{labels.announcement}</div>
    <header className="store-topbar">
      <Link className="store-wordmark" href="/" aria-label={labels.brand}><Image className="store-wordmark-image" src="/images/chicc-wordmark-light.png" alt="" width={99} height={51} priority/></Link>
      <nav className="desktop-nav" aria-label={labels.brand}>
        {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <label className="language-picker"><span>{labels.language}</span><select value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></select></label>
      <details className="mobile-navigation">
        <summary aria-label={labels.menu}><span className="menu-open-label">{labels.menu}</span><span className="menu-close-label">{labels.close}</span><span className="menu-icon" aria-hidden="true"><i/><i/></span></summary>
        <nav className="mobile-menu-panel" aria-label={labels.menu}>
          {links.map(([href, label]) => <Link key={href} href={href}>{label}<span aria-hidden="true"><ChiccIcon name={locale === "ar" ? "arrow-left" : "arrow-right"} /></span></Link>)}
          <Link href="/collection">{collectionLabel}<span aria-hidden="true"><ChiccIcon name={locale === "ar" ? "arrow-left" : "arrow-right"} /></span></Link>
        </nav>
      </details>
    </header>
  </>;
}

function TrustIcon({ index }: { index: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg className="trust-icon-image" viewBox="0 0 32 32" aria-hidden="true">
    {index === 0 && <><path {...common} d="M6 10.5 16 5l10 5.5v11L16 27 6 21.5z"/><path {...common} d="m6 10.5 10 5.7 10-5.7M16 16.2V27M11 7.8l10 5.7"/></>}
    {index === 1 && <><circle {...common} cx="16" cy="16" r="10.5"/><path {...common} d="m11.5 16 3 3 6-7"/></>}
    {index === 2 && <><path {...common} d="M5 10h13v12H5zM18 14h5l4 4v4h-9z"/><circle {...common} cx="10" cy="23" r="2"/><circle {...common} cx="23" cy="23" r="2"/></>}
    {index === 3 && <><rect {...common} x="5.5" y="8" width="21" height="16" rx="2"/><path {...common} d="M6 13h20M11 19h5"/></>}
  </svg>;
}

function chiccBottleForProduct(product: StoreProduct, categories: StoreCategory[]) {
  const categorySlug = categories.find((category) => category.id === product.category_id)?.slug.toLowerCase() ?? "";
  if (categorySlug.includes("femme") || categorySlug.includes("women") || categorySlug.includes("female")) return "/images/chicc-bottle-femme.webp";
  if (categorySlug.includes("homme") || categorySlug.includes("men") || categorySlug.includes("male")) return "/images/chicc-bottle-homme.webp";
  return null;
}

function originalPerfumeForProduct(product: StoreProduct) {
  const key = `${product.slug} ${localized(product.name_i18n, "fr")} ${localized(product.name_i18n, "en")}`.toLocaleLowerCase();
  if (key.includes("boss")) return "/images/original-boss-bottled.webp";
  if (key.includes("black opium") || key.includes("black-opium")) return "/images/original-black-opium.webp";
  if (key.includes("marshmello") || key.includes("marshmallow")) return "/images/original-kayali-marshmello.webp";
  if (key.includes("my way") || key.includes("my-way")) return "/images/original-my-way.webp";
  if (key.includes("kayali") || key.includes("vanilla") || key.includes("intense")) return "/images/original-kayali-vanilla-28.webp";
  if (key.includes("stronger") && key.includes("armani")) return "/images/original-armani-you.webp";
  if (key.includes("stronger") || key.includes("powerfully")) return "/images/original-stronger-with-you.webp";
  if (key.includes("armani")) return "/images/original-armani-you.webp";
  return null;
}

function categoryLabelForProduct(product: StoreProduct, categories: StoreCategory[], locale: Locale) {
  const category = categories.find((item) => item.id === product.category_id);
  return category ? localized(category.name_i18n, locale) : "CHICC";
}

const suppliedProductCardImages: Record<string, string> = {
  "you-armani": "/images/product-cards/you-armani.jpg",
  "boss-white": "/images/product-cards/boss-white.jpg",
  "kayali-intense": "/images/product-cards/kayali-intense.jpg",
  "kayali-marshmello": "/images/product-cards/kayali-marshmello.jpg",
  "my-way": "/images/product-cards/my-way.jpg",
  "black-opium": "/images/product-cards/black-opium.jpg",
  "stronger-with-you-powerfully": "/images/product-cards/stronger-with-you-powerfully.jpg",
};

function ProductCard({ product, locale, text, chiccBottleImage, categoryLabel }: { product: StoreProduct; locale: Locale; text: Copy; chiccBottleImage: string | null; categoryLabel: string }) {
  const name = formatProductName(localized(product.name_i18n, locale), locale);
  const description = localized(product.description_i18n, locale);
  const suppliedCardImage = suppliedProductCardImages[product.slug];
  const originalPerfumeImage = originalPerfumeForProduct(product) ?? product.image_url;
  return <article className="product-card">
    <Link className="product-image-link" href={`/products/${encodeURIComponent(product.slug)}`} aria-label={`${name} — ${text.viewProduct}`}>
      <div className={`product-image-frame${suppliedCardImage ? " product-image-frame-photo" : ` product-image-frame-pair${chiccBottleImage ? "" : " product-image-frame-single"}`}`}>
        <div className="product-card-art-heading"><span>CHICC / {categoryLabel}</span><i aria-hidden="true"/></div>
        <span className="product-tag">{product.is_in_stock ? text.inStock : text.outOfStock}</span>
        {suppliedCardImage ? <Image src={suppliedCardImage} alt="" fill sizes="(max-width: 700px) 100vw, 50vw" className="product-image product-card-photo"/> : chiccBottleImage ? <>
        <span className="product-image-half product-image-original">
          {originalPerfumeImage ? <Image src={originalPerfumeImage} alt="" fill sizes="(max-width: 700px) 25vw, (max-width: 980px) 16vw, 12vw" className="product-image original-perfume-image"/> : <span className="product-placeholder"><Image className="product-placeholder-logo" src="/images/chicc-wordmark-light.png" alt="" width={99} height={51}/></span>}
        </span>
        <span className="product-image-half product-image-chicc">
          <Image src={chiccBottleImage} alt="" fill sizes="(max-width: 700px) 25vw, (max-width: 980px) 16vw, 12vw" className="product-image chicc-bottle-image"/>
        </span>
        </> : product.image_url ? <Image src={product.image_url} alt="" fill sizes="(max-width: 700px) 50vw, (max-width: 980px) 33vw, 25vw" className="product-image"/> : <div className="product-placeholder"><Image className="product-placeholder-logo" src="/images/chicc-wordmark-light.png" alt="" width={99} height={51}/></div>}
      </div>
    </Link>
    <div className="product-copy">
      <h3><Link href={`/products/${encodeURIComponent(product.slug)}`}>{name}</Link></h3>
      {description && <p className="product-tagline">{description}</p>}
      <p className="delivery-note">{text.deliveryNote}</p>
      {description && <details className="product-details"><summary>{text.details}<span aria-hidden="true"><ChiccIcon name="plus" size={16} /></span></summary><p>{description}</p></details>}
      <div className="product-card-bottom">
        <strong className="product-card-price">{formatMinorAmount(product.price_minor, product.currency_code, locale)}</strong>
        <Link className="product-card-action" href={`/products/${encodeURIComponent(product.slug)}`} aria-label={`${name} — ${text.viewProduct}`}><span aria-hidden="true"><ChiccIcon name={locale === "ar" ? "arrow-left" : "arrow-right"} /></span></Link>
      </div>
    </div>
  </article>;
}

export function StorefrontCatalog({ products, categories, catalogReady, view = "home" }: {
  products: StoreProduct[];
  categories: StoreCategory[];
  catalogReady: boolean;
  view?: StorefrontView;
}) {
  const [locale, setLocale] = useStoreLocale();
  const [packSize, setPackSize] = useState<2 | 3>(2);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([]);
  const [packStep, setPackStep] = useState<PackStep>("offers");
  const [packPending, setPackPending] = useState(false);
  const [packOrderError, setPackOrderError] = useState(false);
  const text = copy[locale];
  const categorySlug = view.startsWith("category:") ? view.split(":")[1] : null;
  const activeCategory = categorySlug ? categories.find((category) => matchesCategory(category, categorySlug as "homme" | "femme")) : null;
  const categoryProducts = activeCategory ? products.filter((product) => product.category_id === activeCategory.id) : [];
  const selectedPackProducts = products.filter((product) => selectedPackIds.includes(product.id));
  const packCurrency = selectedPackProducts[0]?.currency_code ?? products[0]?.currency_code ?? "TND";
  const packPriceMinor = packSize === 2 ? 69000 : 89000;
  const homeCategories = [
    { slug: "homme", label: text.men, image: "/images/homme.png" },
    { slug: "femme", label: text.women, image: "/images/femme.png" },
  ];
  const featuredProducts = [...products.filter((product) => product.is_in_stock), ...products.filter((product) => !product.is_in_stock)].slice(0, 4);
  const listedProducts = view === "collection" ? products : categoryProducts;

  function togglePackProduct(product: StoreProduct) {
    if (!product.is_in_stock) return;
    setSelectedPackIds((current) => current.includes(product.id)
      ? current.filter((id) => id !== product.id)
      : current.length < packSize ? [...current, product.id] : current);
  }

  function startPack(size: 2 | 3) {
    setPackSize(size);
    setSelectedPackIds([]);
    setPackOrderError(false);
    setPackStep("selection");
  }

  async function submitPackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!formElement.reportValidity() || selectedPackProducts.length !== packSize) return;
    setPackOrderError(false);
    setPackPending(true);
    try {
      const form = new FormData(formElement);
      const supabase = createBrowserClient();
      const { error } = await supabase.functions.invoke("place-website-order", { body: {
        customer_name: form.get("customer_name"),
        customer_phone: form.get("customer_phone"),
        delivery_address: { street: form.get("street"), city: form.get("region") },
        company_website: form.get("contact_reference"),
        pack_size: packSize,
        items: selectedPackProducts.map((product) => ({ product_id: product.id, quantity: 1 })),
      } });
      if (error) { setPackOrderError(true); return; }
      formElement.reset();
      setPackStep("success");
    } catch {
      setPackOrderError(true);
    } finally {
      setPackPending(false);
    }
  }

  return <main className="store-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
    <div id="top"><StoreHeader locale={locale} onLocaleChange={setLocale} labels={text}/></div>

    {view === "home" && <>
      <section className="home-banner">
        <div className="home-banner-image">
          <Image src="/images/chicc-home-banner-new.webp" alt="Deux flacons de parfum CHICC dans un décor brun chaleureux" fill priority sizes="100vw"/>
          <Link className="banner-art-link" href="/about" aria-label={text.aboutLink} title={text.aboutLink}/>
        </div>
        <div className="home-banner-copy">
          <span className="eyebrow">{text.heroEyebrow}</span>
          <h1>{text.heroTitle}</h1>
          <p>{text.heroText}</p>
          <Link className="banner-about-link" href="/about">{text.aboutLink}<span aria-hidden="true"><ChiccIcon name="arrow-up-right" /></span></Link>
        </div>
      </section>

      <section className="home-intro">
        <span className="eyebrow">{text.introEyebrow}</span>
        <h2>{text.introTitle}</h2>
        <p>{text.introText}</p>
      </section>

      <section className="home-category-section" aria-labelledby="home-categories-title">
        <div className="section-heading"><span className="eyebrow">CHICC · 01</span><h2 id="home-categories-title">{text.categoriesTitle}</h2></div>
        <div className="home-category-grid">{homeCategories.map((category, index) => <Link className={`home-category-card home-category-${category.slug}`} href={`/${category.slug}`} key={category.slug}>
          <span className="home-category-image">{category.image ? <Image src={category.image} alt="" fill sizes="(max-width: 700px) 90vw, 33vw"/> : <span className="category-placeholder">CHICC</span>}</span>
          <span className="home-category-overlay"/>
          <span className="home-category-index">0{index + 1}</span>
          <span className="home-category-name">{category.label}</span>
          <span className="home-category-arrow" aria-hidden="true"><ChiccIcon name="arrow-up-right" /></span>
        </Link>)}</div>
      </section>

      <section className="featured-section" aria-labelledby="featured-title">
        <div className="section-heading"><span className="eyebrow">CHICC · 02</span><h2 id="featured-title">{text.featuredTitle}</h2></div>
        {!catalogReady ? <p className="catalog-empty">{text.setup}</p> : featuredProducts.length === 0 ? <p className="catalog-empty">{text.empty}</p> : <div className="product-grid featured-grid">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} locale={locale} text={text} chiccBottleImage={chiccBottleForProduct(product, categories)} categoryLabel={categoryLabelForProduct(product, categories, locale)}/>)}</div>}
        <div className="see-all-row"><Link className="store-cta" href="/collection">{text.seeAll}<span aria-hidden="true"><ChiccIcon name={locale === "ar" ? "arrow-left" : "arrow-right"} /></span></Link></div>
      </section>
    </>}

    {(view === "collection" || categorySlug) && <>
      <section className="catalog-page-heading">
        <span className="eyebrow">CHICC · {categorySlug ? "01" : "03"}</span>
        <h1>{categorySlug && activeCategory ? localized(activeCategory.name_i18n, locale) : categorySlug === "homme" ? text.men : categorySlug === "femme" ? text.women : text.collectionTitle}</h1>
        <p>{text.categoryIntro}</p>
      </section>
      <section className="catalog-page-products" aria-label={categorySlug ? localized(activeCategory?.name_i18n, locale) : text.collectionTitle}>
        {!catalogReady ? <p className="catalog-empty">{text.setup}</p> : listedProducts.length === 0 ? <p className="catalog-empty">{text.empty}</p> : <div className="product-grid">{listedProducts.map((product) => <ProductCard key={product.id} product={product} locale={locale} text={text} chiccBottleImage={chiccBottleForProduct(product, categories)} categoryLabel={categoryLabelForProduct(product, categories, locale)}/>)}</div>}
      </section>
    </>}

    {view === "packs" && <section className="pack-builder-section" aria-labelledby="pack-title">
      <div className="section-heading pack-heading"><span className="eyebrow">{text.packEyebrow}</span><h1 id="pack-title">{text.packTitle}</h1><p>{text.packIntro}</p></div>
      {!catalogReady ? <p className="catalog-empty">{text.setup}</p> : products.some((product) => product.is_in_stock) ? <>
        {packStep === "offers" && <div className="pack-offer-grid">
          {([2, 3] as const).map((size) => <article className={`pack-offer-card${size === 3 ? " is-best-value" : ""}`} key={size}>
            {size === 3 && <span className="pack-best-value">{text.packBestValue}</span>}
            <div className="pack-offer-art" aria-hidden="true">
              {Array.from({ length: size }, (_, index) => <svg className="pack-offer-bottle" key={index} viewBox="0 0 68 118" fill="none">
                <rect x="24" y="4" width="20" height="25" rx="2"/><path d="M27 29v9H21c-3 0-5 2-5 5v61c0 4 3 7 7 7h22c4 0 7-3 7-7V43c0-3-2-5-5-5h-6v-9"/><path d="M23 47c7 4 5 12 11 15s10 1 12 9v32H22V49"/><path d="M23 47h22"/>
              </svg>)}
            </div>
            <div className="pack-offer-copy">
              <h2>{size === 2 ? text.packDuo : text.packTrio}</h2>
              <span className="pack-offer-spec">{size === 2 ? "2" : "3"} {locale === "fr" ? "FLACONS · 50ML" : locale === "ar" ? "عطور · 50 مل" : "FULL BOTTLES · 50ML"}</span>
              <p>{size === 2 ? text.packDuoNote : text.packTrioNote}</p>
              <div className="pack-offer-price"><del>{formatMinorAmount(size === 2 ? 78000 : 117000, packCurrency, locale)}</del><strong>{formatMinorAmount(size === 2 ? 69000 : 89000, packCurrency, locale)}</strong></div>
              <div className="pack-offer-badges"><span>{text.packSave} {formatMinorAmount(size === 2 ? 9000 : 28000, packCurrency, locale)}</span><small>{text.packFreeDelivery}</small></div>
              <button className="pack-offer-button" type="button" onClick={() => startPack(size)}>{size === 2 ? text.packPickTwo : text.packPickThree}</button>
            </div>
          </article>)}
        </div>}

        {packStep === "selection" && <div className="pack-picker">
          <button className="pack-back-button" type="button" onClick={() => setPackStep("offers")}><ChiccIcon name={locale === "ar" ? "arrow-right" : "arrow-left"} /> {text.packBack}</button>
          <div className="pack-picker-heading"><div><span className="eyebrow">{packSize === 2 ? text.packDuo : text.packTrio}</span><h2>{text.packChoose}</h2><p aria-live="polite">{selectedPackIds.length} / {packSize} {text.packSelected}{selectedPackIds.length < packSize ? ` · ${packSize - selectedPackIds.length} ${text.packRemaining}` : ""}</p></div><span className="pack-total">{text.packTotal}<strong>{formatMinorAmount(packPriceMinor, packCurrency, locale)}</strong></span></div>
          <div className="pack-product-grid">{products.map((product) => {
            const selected = selectedPackIds.includes(product.id);
            const disabled = !product.is_in_stock || (!selected && selectedPackIds.length >= packSize);
            return <button type="button" key={product.id} className={`pack-product${selected ? " is-selected" : ""}`} aria-pressed={selected} disabled={disabled} onClick={() => togglePackProduct(product)}>
              <span className="pack-product-image">{product.image_url ? <Image src={product.image_url} alt="" fill sizes="(max-width: 700px) 40vw, 160px" className="product-image"/> : <Image className="pack-placeholder-logo" src="/images/chicc-wordmark-light.png" alt="" width={99} height={51}/>}</span>
              <span className="pack-product-copy"><span>{formatProductName(localized(product.name_i18n, locale), locale)}</span><strong>{formatMinorAmount(product.price_minor, product.currency_code, locale)}</strong></span>
              <span className="pack-product-check" aria-hidden="true"><ChiccIcon name={selected ? "check" : "plus"} /></span>
            </button>;
          })}</div>
          <div className={`pack-summary${selectedPackIds.length === packSize ? " is-complete" : ""}`} aria-live="polite">
            <div className="pack-summary-main">
              <span className="pack-summary-label"><span className="pack-summary-mark" aria-hidden="true"><ChiccIcon name={selectedPackIds.length === packSize ? "check" : "sparkles"} /></span><span className="eyebrow">{text.packTitle} · {selectedPackIds.length}/{packSize}</span></span>
              <p>{selectedPackProducts.length ? selectedPackProducts.map((product) => formatProductName(localized(product.name_i18n, locale), locale)).join(" · ") : text.packChoose}</p>
              <span className="pack-progress" aria-hidden="true">{Array.from({ length: packSize }, (_, index) => <i className={index < selectedPackIds.length ? "is-filled" : ""} key={index}/>)}</span>
            </div>
            <div className="pack-summary-price"><span>{selectedPackIds.length === packSize ? text.packReady : `${packSize - selectedPackIds.length} ${text.packRemaining}`}</span><strong>{formatMinorAmount(packPriceMinor, packCurrency, locale)}</strong><small>{text.packFreeDelivery}</small></div>
            <div className="pack-summary-action"><button className="pack-summary-button" type="button" disabled={selectedPackIds.length !== packSize} onClick={() => { setPackOrderError(false); setPackStep("checkout"); }}>{text.packToOrder}<span aria-hidden="true"><ChiccIcon name={locale === "ar" ? "arrow-left" : "arrow-right"} /></span></button></div>
          </div>
        </div>}

        {packStep === "checkout" && <div className="pack-checkout">
          <button className="pack-back-button" type="button" onClick={() => setPackStep("selection")}><ChiccIcon name={locale === "ar" ? "arrow-right" : "arrow-left"} /> {text.packChoose}</button>
          <div className="pack-checkout-grid">
            <section className="pack-checkout-summary"><span className="eyebrow">{packSize === 2 ? text.packDuo : text.packTrio}</span><h2>{text.packTitle}</h2><ul>{selectedPackProducts.map((product) => <li key={product.id}>{formatProductName(localized(product.name_i18n, locale), locale)}</li>)}</ul><div className="pack-checkout-total"><span>{text.packTotal}</span><strong>{formatMinorAmount(packPriceMinor, packCurrency, locale)}</strong></div><small>{text.packFreeDelivery} · {text.packDelivery}</small></section>
            <section className="product-order-card pack-order-card"><h2>{text.packOrderTitle}</h2><p>{text.packOrderIntro}</p><form onSubmit={submitPackOrder} className="order-request-form pack-order-form">
              <label><span>{text.packCustomerName}</span><input name="customer_name" required maxLength={120} autoComplete="name"/></label>
              <label><span>{text.packPhone}</span><input name="customer_phone" required type="tel" maxLength={40} autoComplete="tel"/></label>
              <label><span>{text.packStreet}</span><input name="street" required maxLength={300} autoComplete="street-address"/></label>
              <label><span>{text.packRegion}</span><select name="region" required defaultValue=""><option value="">{text.packChooseRegion}</option>{storeGovernorates.map((region) => <option key={region.code} value={region.fr}>{region[locale]}</option>)}</select></label>
              <div className="order-honeypot" aria-hidden="true"><input name="contact_reference" tabIndex={-1} autoComplete="new-password" aria-hidden="true"/></div>
              {packOrderError && <p className="form-message" role="alert">{text.packFailure}</p>}
              <button className="primary-button" type="submit" disabled={packPending || selectedPackProducts.length !== packSize}>{packPending ? text.packSubmitting : text.packPlaceOrder}</button>
            </form></section>
          </div>
        </div>}

        {packStep === "success" && <section className="pack-order-success" role="status"><span className="eyebrow">CHICC · {text.packTitle}</span><h2>{text.packSuccess}</h2><p>{selectedPackProducts.map((product) => formatProductName(localized(product.name_i18n, locale), locale)).join(" · ")}</p><strong>{formatMinorAmount(packPriceMinor, packCurrency, locale)}</strong><Link className="store-cta" href="/collection">{text.packContinue}<span aria-hidden="true"><ChiccIcon name={locale === "ar" ? "arrow-left" : "arrow-right"} /></span></Link></section>}
      </> : <p className="catalog-empty">{text.empty}</p>}
    </section>}

    {view === "about" && <>
      <section className="about-page-hero">
        <div className="about-page-copy"><span className="eyebrow">{text.aboutEyebrow}</span><h1>{text.aboutTitle}</h1><p>{text.aboutText}</p><Link className="store-cta" href="/collection">{text.collection}<span aria-hidden="true"><ChiccIcon name={locale === "ar" ? "arrow-left" : "arrow-right"} /></span></Link></div>
        <div className="about-page-image"><Image src="/images/chicc-about-silk.webp" alt="" fill priority sizes="(max-width: 760px) 100vw, 50vw"/></div>
      </section>
      <section className="about-story"><div><span className="eyebrow">CHICC · NOS VALEURS</span><h2>{text.aboutSecondTitle}</h2></div><p>{text.aboutSecondText}</p></section>
      <section className="about-values">{[
        [text.aboutValueOne, text.aboutValueOneText],
        [text.aboutValueTwo, text.aboutValueTwoText],
        [text.aboutValueThree, text.aboutValueThreeText],
      ].map(([title, description], index) => <article className="about-value" key={title}><span className="eyebrow">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</section>
    </>}

    <section className="trust-strip">
      {[text.trustTeam, text.trustStock, text.trustDelivery, text.trustPayment].map((label, index) => <div className="trust-item" key={label}><span className="trust-icon"><TrustIcon index={index}/></span><span>{label}</span></div>)}
    </section>
    <footer className="store-footer">
      <div className="footer-brand"><Link className="store-wordmark" href="/" aria-label={text.brand}><Image className="store-wordmark-image" src="/images/chicc-wordmark-dark.png" alt="" width={95} height={51}/></Link><p>{text.introText}</p><small>© CHICC</small></div>
      <div className="footer-link-group"><span className="footer-label">{text.collection}</span><Link href="/homme">{text.men}</Link><Link href="/femme">{text.women}</Link><Link href="/packs">{text.packs}</Link><Link href="/collection">{text.collection}</Link></div>
      <div className="footer-link-group"><span className="footer-label">{text.brand}</span><Link href="/about">{text.about}</Link><Link href="/#top">{text.brand}</Link><Link href="/collection">{text.seeAll}</Link></div>
    </footer>
  </main>;
}
