"use client";
import Image from "next/image";
import Link from "next/link";
import { type Locale, type LocalizedText, formatMinorAmount } from "@chicc/types";
import { useEffect, useState } from "react";
type Category = { id: string; name_i18n: LocalizedText };
type CatalogProduct = { id:string; slug:string; category_id:string|null; name_i18n:LocalizedText; description_i18n:Partial<LocalizedText>|null; image_url:string|null; is_in_stock:boolean; price_minor:string|number; currency_code:string };
const copy:Record<Locale,{brand:string;title:string;intro:string;language:string;empty:string;setup:string;categories:string;all:string;explore:string;collectionLabel:string;viewProduct:string;outOfStock:string}>={
 fr:{brand:"CHICC",title:"La sélection",intro:"Découvrez la collection CHICC.",language:"Langue",empty:"Les produits seront bientôt disponibles.",setup:"Le catalogue Supabase doit être configuré avant de publier les produits.",categories:"Catégories",all:"Tout voir",explore:"Explorer la sélection",collectionLabel:"LE QUOTIDIEN, CHOISI AVEC SOIN",viewProduct:"Voir le produit",outOfStock:"Épuisé"},
 ar:{brand:"CHICC",title:"التشكيلة",intro:"اكتشف مجموعة CHICC.",language:"اللغة",empty:"ستتوفر المنتجات قريباً.",setup:"يجب إعداد كتالوج Supabase قبل نشر المنتجات.",categories:"الفئات",all:"عرض الكل",explore:"تصفح التشكيلة",collectionLabel:"اختيارات يومية بعناية",viewProduct:"عرض المنتج",outOfStock:"نفد المخزون"},
 en:{brand:"CHICC",title:"The collection",intro:"Discover the CHICC collection.",language:"Language",empty:"Products will be available soon.",setup:"Configure the Supabase catalog before publishing products.",categories:"Categories",all:"View all",explore:"Explore the collection",collectionLabel:"THOUGHTFULLY CHOSEN FOR EVERY DAY",viewProduct:"View product",outOfStock:"Out of stock"}
};
function localized(text:Partial<LocalizedText>|null|undefined,locale:Locale){return text?.[locale]||text?.fr||text?.en||""}
export function StorefrontCatalog({products,categories,catalogReady}:{products:CatalogProduct[];categories:Category[];catalogReady:boolean}){
 const [locale,setLocale]=useState<Locale>("fr");
 const [categoryId,setCategoryId]=useState<string|null>(null);
 const text=copy[locale];
 const visibleProducts=categoryId?products.filter(p=>p.category_id===categoryId):products;
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==="ar"?"rtl":"ltr"},[locale]);
 return <main className="store-shell" lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
  <header className="store-topbar"><Link className="eyebrow store-brand-link" href="/">{text.brand}</Link>
   <label className="language-picker"><span>{text.language}</span><select value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></select></label>
  </header>
  <section className="store-heading"><div className="store-heading-copy"><span className="eyebrow">{text.collectionLabel}</span><h1>{text.title}</h1><p className="intro">{text.intro}</p><a className="store-cta" href="#collection">{text.explore}<span aria-hidden="true">↘</span></a></div>
   <div className="store-hero-art" aria-hidden="true"><span className="store-hero-orbit store-hero-orbit-one"/><span className="store-hero-orbit store-hero-orbit-two"/><span className="store-hero-monogram">C</span><span className="store-hero-caption">CHICC <span>·</span> 01</span></div>
  </section>
  {!catalogReady?<p className="catalog-empty" id="collection">{text.setup}</p>:products.length===0?<p className="catalog-empty" id="collection">{text.empty}</p>:<div className="collection-content" id="collection">
   {categories.length>0&&<nav className="category-filters" aria-label={text.categories}><button type="button" className={!categoryId?"filter-chip is-selected":"filter-chip"} onClick={()=>setCategoryId(null)}>{text.all}</button>{categories.map(c=><button type="button" key={c.id} className={categoryId===c.id?"filter-chip is-selected":"filter-chip"} onClick={()=>setCategoryId(c.id)}>{localized(c.name_i18n,locale)}</button>)}</nav>}
   <section className="product-grid" aria-label={text.title}>{visibleProducts.map(p=><Link className="product-card" href={"/products/"+encodeURIComponent(p.slug)} key={p.id} aria-label={localized(p.name_i18n,locale)+" — "+text.viewProduct}>
    <div className="product-image-frame">{p.image_url?<Image src={p.image_url} alt={localized(p.name_i18n,locale)} fill sizes="(max-width: 520px) 100vw, (max-width: 760px) 50vw, 33vw" className="product-image"/>:<div className="product-placeholder" aria-hidden="true">CHICC</div>}</div>
    <div className="product-copy"><h2>{localized(p.name_i18n,locale)}</h2>{p.description_i18n&&<p>{localized(p.description_i18n,locale)}</p>}<strong>{formatMinorAmount(p.price_minor,p.currency_code,locale)}</strong><span className="product-card-action">{p.is_in_stock?text.viewProduct:text.outOfStock}<span aria-hidden="true">↗</span></span></div>
   </Link>)}</section>
  </div>}
 </main>
}