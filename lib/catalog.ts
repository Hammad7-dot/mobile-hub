import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { products as fallbackProducts, type Product } from "@/lib/products";

type ProductRow={slug:string;name:string;price:number;compare_at_price:number|null;featured:boolean;status:string;specifications:Record<string,string>;images:string[];brands:{name:string}|{name:string}[]|null};
function mapProduct(row:ProductRow):Product{const brand=Array.isArray(row.brands)?row.brands[0]?.name:row.brands?.name;const s=row.specifications||{};return{slug:row.slug,name:row.name,brand:brand||"Other",price:Number(row.price),oldPrice:row.compare_at_price?Number(row.compare_at_price):undefined,ram:s.ram||"—",storage:s.storage||"—",display:s.display||"—",processor:s.processor||"—",camera:s.camera||"—",battery:s.battery||"—",os:s.os||"—",color:"#d8ba72",images:row.images||[],featured:row.featured,isNew:row.status==="upcoming"}}
export async function getProducts(){if(!hasSupabaseEnv)return fallbackProducts;try{const supabase=await createClient();const{data,error}=await supabase.from("products").select("slug,name,price,compare_at_price,featured,status,specifications,images,brands(name)").in("status",["active","upcoming"]).order("created_at",{ascending:false});if(error||!data?.length)return fallbackProducts;return(data as unknown as ProductRow[]).map(mapProduct)}catch{return fallbackProducts}}
export async function getProductBySlug(slug:string){const catalog=await getProducts();return catalog.find(product=>product.slug===slug)}
