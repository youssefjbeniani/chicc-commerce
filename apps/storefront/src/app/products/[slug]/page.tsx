import { notFound } from "next/navigation";
import type { LocalizedText } from "@chicc/types";
import { StorefrontProductPage } from "@/components/storefront-product-page";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
type ProductRecord={id:string;slug:string;name_i18n:LocalizedText;description_i18n:Partial<LocalizedText>|null;image_path:string|null;is_in_stock:boolean;price_minor:string|number;currency_code:string};
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
 if(!hasSupabaseConfig()) notFound();
 const {slug}=await params;
 const supabase=createClient();
 const {data,error}=await supabase.from("products").select("id,slug,name_i18n,description_i18n,image_path,is_in_stock,price_minor,currency_code").eq("slug",slug).eq("is_published",true).maybeSingle();
 if(error||!data) notFound();
 const product:ProductRecord&{image_url:string|null}={...data,image_url:data.image_path?supabase.storage.from("chicc-product-images").getPublicUrl(data.image_path).data.publicUrl:null};
 return <StorefrontProductPage product={product}/>;
}