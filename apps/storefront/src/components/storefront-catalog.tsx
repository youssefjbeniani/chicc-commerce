"use client";
import Image from "next/image";
import Link from "next/link";
import { type Locale, type LocalizedText, formatMinorAmount } from "@chicc/types";
import { useEffect, useState } from "react";
type Category = { id: string; name_i18n: LocalizedText };
type CatalogProduct = { id:string; slug:string; category_id:string|null; name_i18n:LocalizedText; description_i18n:Partial<LocalizedText>|null; image_url:string|null; is_in_stock:boolean; price_minor:string|number; currency_code:string };
const copy:Record<Locale,{brand:string;title:string;intro:string;language:string;empty:string;setup:string;categories:string;all:string;explore:string;collectionLabel:string;viewProduct:string;outOfStock:string;announcement:string;menu:string;close:string;inStock:string;details:string;deliveryNote:string;trustTeam:string;trustStock:string;trustDelivery:string;trustPayment:string}>={
 fr:{brand:"CHICC",title:"La sélection",intro:"Découvrez la collection CHICC.",language:"Langue",empty:"Les produits seront bientôt disponibles.",setup:"Le catalogue Supabase doit être configuré avant de publier les produits.",categories:"Catégories",all:"Tout voir",explore:"Explorer la sélection",collectionLabel:"LE QUOTIDIEN, CHOISI AVEC SOIN",viewProduct:"Voir le produit",outOfStock:"Épuisé",announcement:"L’équipe CHICC vous contactera pour confirmer la commande et la livraison.",menu:"Menu",close:"Fermer",inStock:"Disponible",details:"Voir les détails",deliveryNote:"L’équipe CHICC vous contactera pour confirmer la commande et la livraison.",trustTeam:"Commande confirmée par l’équipe",trustStock:"Disponibilité affichée",trustDelivery:"Livraison confirmée avec vous",trustPayment:"Aucun paiement en ligne"},
 ar:{brand:"CHICC",title:"التشكيلة",intro:"اكتشف مجموعة CHICC.",language:"اللغة",empty:"ستتوفر المنتجات قريباً.",setup:"يجب إعداد كتالوج Supabase قبل نشر المنتجات.",categories:"الفئات",all:"عرض الكل",explore:"تصفح التشكيلة",collectionLabel:"اختيارات يومية بعناية",viewProduct:"عرض المنتج",outOfStock:"نفد المخزون",announcement:"سيتواصل معك فريق CHICC لتأكيد الطلب والتوصيل.",menu:"القائمة",close:"إغلاق",inStock:"متوفر",details:"عرض التفاصيل",deliveryNote:"سيتواصل معك فريق CHICC لتأكيد الطلب والتوصيل.",trustTeam:"تأكيد الطلب من فريق CHICC",trustStock:"التوفر موضح",trustDelivery:"تأكيد تفاصيل التوصيل معك",trustPayment:"لا يوجد دفع عبر الإنترنت"},
 en:{brand:"CHICC",title:"The collection",intro:"Discover the CHICC collection.",language:"Language",empty:"Products will be available soon.",setup:"Configure the Supabase catalog before publishing products.",categories:"Categories",all:"View all",explore:"Explore the collection",collectionLabel:"THOUGHTFULLY CHOSEN FOR EVERY DAY",viewProduct:"View product",outOfStock:"Out of stock",announcement:"The CHICC team will contact you to confirm your order and delivery.",menu:"Menu",close:"Close",inStock:"In stock",details:"See details",deliveryNote:"The CHICC team will contact you to confirm your order and delivery.",trustTeam:"Orders confirmed by CHICC",trustStock:"Availability shown",trustDelivery:"Delivery details confirmed with you",trustPayment:"No online payments"}
};
function localized(text:Partial<LocalizedText>|null|undefined,locale:Locale){return text?.[locale]||text?.fr||text?.en||""}

type StoreHeaderLabels = { brand:string; language:string; categories:string; all:string; announcement:string; menu:string; close:string };
export function StoreHeader({locale,onLocaleChange,labels}:{locale:Locale;onLocaleChange:(locale:Locale)=>void;labels:StoreHeaderLabels}) {
 return <>
  <div className="announcement-bar">{labels.announcement}</div>
  <header className="store-topbar">
   <Link className="store-wordmark" href="/" aria-label={labels.brand}>chicc<span aria-hidden="true">.</span></Link>
   <nav className="desktop-nav" aria-label={labels.brand}><a href="/#categories">{labels.categories}</a><a href="/#collection">{labels.all}</a></nav>
   <label className="language-picker"><span>{labels.language}</span><select value={locale} onChange={event=>onLocaleChange(event.target.value as Locale)}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></select></label>
   <details className="mobile-navigation"><summary aria-label={labels.menu}><span className="menu-open-label">{labels.menu}</span><span className="menu-close-label">{labels.close}</span><span className="menu-icon" aria-hidden="true"><i/><i/></span></summary>
    <nav className="mobile-menu-panel" aria-label={labels.menu}><a href="/#categories">{labels.categories}<span aria-hidden="true">→</span></a><a href="/#collection">{labels.all}<span aria-hidden="true">→</span></a><a href="/#top">{labels.brand}<span aria-hidden="true">→</span></a></nav>
   </details>
  </header>
 </>;
}

export function StorefrontCatalog({products,categories,catalogReady}:{products:CatalogProduct[];categories:Category[];catalogReady:boolean}){
 const [locale,setLocale]=useState<Locale>("fr");
 const [categoryId,setCategoryId]=useState<string|null>(null);
 const text=copy[locale];
 const visibleProducts=categoryId?products.filter(p=>p.category_id===categoryId):products;
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==="ar"?"rtl":"ltr"},[locale]);
 return <main className="store-shell" lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
  <div id="top"><StoreHeader locale={locale} onLocaleChange={setLocale} labels={text}/></div>
  <section className="store-heading">
   <span className="hero-index" aria-hidden="true">CHICC · 01</span>
   <div className="store-heading-copy"><span className="eyebrow">{text.collectionLabel}</span><h1>{text.title}</h1><p className="intro">{text.intro}</p><a className="store-cta" href="#collection">{text.explore}<span aria-hidden="true">→</span></a></div>
  </section>
  {catalogReady&&categories.length>0&&<section className="category-section" id="categories" aria-labelledby="category-title">
   <div className="section-heading"><span className="eyebrow">CHICC · 02</span><h2 id="category-title">{text.categories}</h2></div>
   <div className="category-tiles">{[{id:null as string|null,label:text.all},...categories.map(category=>({id:category.id,label:localized(category.name_i18n,locale)}))].map((category,index)=><button type="button" key={category.id??"all"} className={"category-tile"+(categoryId===category.id?" is-selected":"")} aria-pressed={categoryId===category.id} onClick={()=>setCategoryId(category.id)}><span className="category-tile-index">0{index+1}</span><span className="category-tile-name">{category.label}</span><span className="category-tile-arrow" aria-hidden="true">↗</span></button>)}</div>
  </section>}
  {catalogReady&&products.length>0&&<section className="product-marquee" aria-label={text.title}><div className="marquee-track" aria-hidden="true"><span>{[...products,...products].map(product=>localized(product.name_i18n,locale)).join(" · ")}</span></div></section>}
  {!catalogReady?<p className="catalog-empty" id="collection">{text.setup}</p>:products.length===0?<p className="catalog-empty" id="collection">{text.empty}</p>:<div className="collection-content" id="collection">
   <section className="product-grid" aria-label={text.title}>{visibleProducts.map(p=><article className="product-card" key={p.id}>
    <Link className="product-image-link" href={"/products/"+encodeURIComponent(p.slug)} aria-label={localized(p.name_i18n,locale)+" — "+text.viewProduct}>
     <div className="product-image-frame">{p.image_url?<Image src={p.image_url} alt={localized(p.name_i18n,locale)} fill sizes="(max-width: 700px) 50vw, (max-width: 980px) 33vw, 25vw" className="product-image"/>:<div className="product-placeholder" aria-hidden="true">chicc.</div>}</div>
    </Link>
    <div className="product-copy">
     <div className="product-card-meta"><span className="product-tag">{p.is_in_stock?text.inStock:text.outOfStock}</span><strong>{formatMinorAmount(p.price_minor,p.currency_code,locale)}</strong></div>
     <h3><Link href={"/products/"+encodeURIComponent(p.slug)}>{localized(p.name_i18n,locale)}</Link></h3>
     {p.description_i18n&&<p className="product-tagline">{localized(p.description_i18n,locale)}</p>}
     <p className="delivery-note">{text.deliveryNote}</p>
     {p.description_i18n&&<details className="product-details"><summary>{text.details}<span aria-hidden="true">+</span></summary><p>{localized(p.description_i18n,locale)}</p></details>}
     <Link className="product-card-action" href={"/products/"+encodeURIComponent(p.slug)}>{text.viewProduct}<span aria-hidden="true">→</span></Link>
    </div>
   </article>)}</section>
  </div>}
  <section className="trust-strip">
   {[text.trustTeam,text.trustStock,text.trustDelivery,text.trustPayment].map((label,index)=><div className="trust-item" key={label}><span className="trust-icon" aria-hidden="true">{["✳","✓","→","○"][index]}</span><span>{label}</span></div>)}
  </section>
  <footer className="store-footer">
   <div className="footer-brand"><Link className="store-wordmark" href="/" aria-label={text.brand}>chicc<span aria-hidden="true">.</span></Link><p>{text.intro}</p><small>© CHICC</small></div>
   <div className="footer-link-group"><span className="footer-label">{text.categories}</span><a href="/#categories">{text.categories}</a><a href="/#collection">{text.all}</a></div>
   <div className="footer-link-group"><span className="footer-label">{text.brand}</span><a href="/#top">{text.brand}</a><a href="/#collection">{text.explore}</a></div>
  </footer>
 </main>
}