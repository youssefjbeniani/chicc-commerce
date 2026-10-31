"use client";
import Image from "next/image";
import Link from "next/link";
import { formatMinorAmount,type Locale,type LocalizedText } from "@chicc/types";
import { type FormEvent,useEffect,useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
type Product={id:string;slug:string;name_i18n:LocalizedText;description_i18n:Partial<LocalizedText>|null;image_url:string|null;is_in_stock:boolean;price_minor:string|number;currency_code:string};
type OrderState="success"|"unavailable"|null;
const copy:Record<Locale,{brand:string;language:string;back:string;quantity:string;unavailable:string;orderTitle:string;orderIntro:string;customerName:string;phone:string;street:string;region:string;chooseRegion:string;placeOrder:string;submitting:string;success:string;failure:string;total:string}>={
 fr:{brand:"CHICC",language:"Langue",back:"Retour à la sélection",quantity:"Quantité",unavailable:"Ce produit est actuellement épuisé.",orderTitle:"Finaliser votre demande",orderIntro:"L’équipe CHICC vous contactera pour confirmer la commande et la livraison.",customerName:"Nom complet",phone:"Téléphone",street:"Adresse",region:"Gouvernorat",chooseRegion:"Sélectionner un gouvernorat",placeOrder:"Envoyer la demande",submitting:"Envoi…",success:"Votre demande est reçue. L’équipe CHICC vous contactera pour confirmer la livraison.",failure:"Impossible d’envoyer la demande. Le stock a peut-être changé; réessayez.",total:"Total estimé"},
 ar:{brand:"CHICC",language:"اللغة",back:"العودة إلى التشكيلة",quantity:"الكمية",unavailable:"هذا المنتج غير متوفر حالياً.",orderTitle:"إتمام طلبك",orderIntro:"سيتواصل معك فريق CHICC لتأكيد الطلب والتوصيل.",customerName:"الاسم الكامل",phone:"الهاتف",street:"العنوان",region:"الولاية",chooseRegion:"اختر ولاية",placeOrder:"إرسال الطلب",submitting:"جارٍ الإرسال…",success:"تم استلام طلبك. سيتواصل معك فريق CHICC لتأكيد التوصيل.",failure:"تعذر إرسال الطلب. ربما تغير المخزون؛ حاول مجدداً.",total:"الإجمالي التقديري"},
 en:{brand:"CHICC",language:"Language",back:"Back to collection",quantity:"Quantity",unavailable:"This product is currently out of stock.",orderTitle:"Complete your order",orderIntro:"The CHICC team will contact you to confirm your order and delivery.",customerName:"Full name",phone:"Phone number",street:"Street address",region:"Governorate",chooseRegion:"Choose a governorate",placeOrder:"Send order request",submitting:"Sending…",success:"Your request was received. The CHICC team will contact you to confirm delivery.",failure:"Could not send the request. Stock may have changed; please try again.",total:"Estimated total"}
};
type TunisianGovernorate={code:string;fr:string;ar:string;en:string};
const governorates:TunisianGovernorate[]=[
 {code:"ariana",fr:"Ariana",ar:"أريانة",en:"Ariana"},{code:"beja",fr:"Béja",ar:"باجة",en:"Beja"},
 {code:"ben_arous",fr:"Ben Arous",ar:"بن عروس",en:"Ben Arous"},{code:"bizerte",fr:"Bizerte",ar:"بنزرت",en:"Bizerte"},
 {code:"gabes",fr:"Gabès",ar:"قابس",en:"Gabes"},{code:"gafsa",fr:"Gafsa",ar:"قفصة",en:"Gafsa"},
 {code:"jendouba",fr:"Jendouba",ar:"جندوبة",en:"Jendouba"},{code:"kairouan",fr:"Kairouan",ar:"القيروان",en:"Kairouan"},
 {code:"kasserine",fr:"Kasserine",ar:"القصرين",en:"Kasserine"},{code:"kebili",fr:"Kébili",ar:"قبلي",en:"Kebili"},
 {code:"kef",fr:"Le Kef",ar:"الكاف",en:"Kef"},{code:"mahdia",fr:"Mahdia",ar:"المهدية",en:"Mahdia"},
 {code:"manouba",fr:"Manouba",ar:"منوبة",en:"Manouba"},{code:"medenine",fr:"Médenine",ar:"مدنين",en:"Medenine"},
 {code:"monastir",fr:"Monastir",ar:"المنستير",en:"Monastir"},{code:"nabeul",fr:"Nabeul",ar:"نابل",en:"Nabeul"},
 {code:"sfax",fr:"Sfax",ar:"صفاقس",en:"Sfax"},{code:"sidi_bouzid",fr:"Sidi Bouzid",ar:"سيدي بوزيد",en:"Sidi Bouzid"},
 {code:"siliana",fr:"Siliana",ar:"سليانة",en:"Siliana"},{code:"sousse",fr:"Sousse",ar:"سوسة",en:"Sousse"},
 {code:"tataouine",fr:"Tataouine",ar:"تطاوين",en:"Tataouine"},{code:"tozeur",fr:"Tozeur",ar:"توزر",en:"Tozeur"},
 {code:"tunis",fr:"Tunis",ar:"تونس",en:"Tunis"},{code:"zaghouan",fr:"Zaghouan",ar:"زغوان",en:"Zaghouan"},
];
function localized(t:Partial<LocalizedText>|null|undefined,l:Locale){return t?.[l]||t?.fr||t?.en||""}
export function StorefrontProductPage({product}:{product:Product}){
 const [locale,setLocale]=useState<Locale>("fr"),[quantity,setQuantity]=useState(1),[pending,setPending]=useState(false),[orderState,setOrderState]=useState<OrderState>(null),text=copy[locale];
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==="ar"?"rtl":"ltr"},[locale]);
 async function submitOrder(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const formElement=event.currentTarget;setOrderState(null);if(!formElement.reportValidity())return;setPending(true);
  try{const form=new FormData(formElement);const supabase=createBrowserClient();const {error}=await supabase.functions.invoke("place-website-order",{body:{
   customer_name:form.get("customer_name"),customer_phone:form.get("customer_phone"),
   delivery_address:{street:form.get("street"),city:form.get("region")},
   company_website:form.get("contact_reference"),items:[{product_id:product.id,quantity}]
  }});
  if(error){setOrderState("unavailable");return}setOrderState("success");formElement.reset();setQuantity(1);
  }catch{setOrderState("unavailable")}finally{setPending(false)}
 }
 const total=Number(product.price_minor)*quantity;
 return <main className="store-shell" lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
  <header className="store-topbar"><Link className="eyebrow store-brand-link" href="/">{text.brand}</Link><label className="language-picker"><span>{text.language}</span><select value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></select></label></header>
  <Link className="product-back-link" href="/">← {text.back}</Link>
  <section className="product-detail-grid"><div className="product-detail-image">{product.image_url?<Image src={product.image_url} alt={localized(product.name_i18n,locale)} fill priority sizes="(max-width: 800px) 100vw, 50vw" className="product-image"/>:<div className="product-placeholder" aria-hidden="true">CHICC</div>}</div>
   <div className="product-detail-copy"><span className="eyebrow">CHICC · {product.slug}</span><h1>{localized(product.name_i18n,locale)}</h1><strong className="product-detail-price">{formatMinorAmount(product.price_minor,product.currency_code,locale)}</strong>{product.description_i18n&&<p className="product-detail-description">{localized(product.description_i18n,locale)}</p>}
   {!product.is_in_stock?<p className="form-message" role="status">{text.unavailable}</p>:<section className="product-order-card" id="order"><h2>{text.orderTitle}</h2><p>{text.orderIntro}</p><form onSubmit={submitOrder} className="order-request-form">
    <label><span>{text.quantity}</span><input name="quantity" type="number" min={1} max={25} step={1} required value={quantity} onChange={e=>setQuantity(Math.min(25,Math.max(1,Number(e.target.value)||1)))}/></label>
    <p className="product-order-total"><span>{text.total}</span><strong>{formatMinorAmount(total,product.currency_code,locale)}</strong></p>
    <label><span>{text.customerName}</span><input name="customer_name" required maxLength={120} autoComplete="name"/></label><label><span>{text.phone}</span><input name="customer_phone" required type="tel" maxLength={40} autoComplete="tel"/></label>
    <label><span>{text.street}</span><input name="street" required maxLength={300} autoComplete="street-address"/></label>
    <label><span>{text.region}</span><select name="region" required defaultValue=""><option value="">{text.chooseRegion}</option>{governorates.map(region=><option key={region.code} value={region.fr}>{region[locale]}</option>)}</select></label>
    <div className="order-honeypot" aria-hidden="true"><input name="contact_reference" tabIndex={-1} autoComplete="new-password" aria-hidden="true"/></div>
    {orderState&&<p className={orderState==="success"?"success-message":"form-message"} role={orderState==="success"?"status":"alert"}>{orderState==="success"?text.success:text.failure}</p>}
    <button className="primary-button" type="submit" disabled={pending}>{pending?text.submitting:text.placeOrder}</button>
   </form></section>}
   </div>
  </section>
 </main>;
}