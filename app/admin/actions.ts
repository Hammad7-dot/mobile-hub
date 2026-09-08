"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

function parseImages(value: FormDataEntryValue | null) { try { const parsed=JSON.parse(String(value||"[]")); return Array.isArray(parsed)?parsed.filter(item=>typeof item==="string").slice(0,6):[]; } catch { return []; } }

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  if (name.length < 2 || !slug || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) throw new Error("Check the product name, slug, price, and stock.");
  const payload = {
    brand_id: String(formData.get("brand_id")), name, slug,
    sku: String(formData.get("sku") || "").trim() || null,
    price, compare_at_price: Number(formData.get("compare_at_price")) || null, stock,
    status: String(formData.get("status")), featured: formData.get("featured") === "on",
    pta_approved: formData.get("pta_approved") === "on",
    warranty: String(formData.get("warranty") || "1 Year"),
    description: String(formData.get("description") || ""), images: parseImages(formData.get("images")),
    specifications: Object.fromEntries(["ram", "storage", "display", "processor", "camera", "battery", "os"].map(key => [key, String(formData.get(key) || "")])),
    updated_at: new Date().toISOString()
  };
  const query = id ? supabase.from("products").update(payload).eq("id", id) : supabase.from("products").insert(payload);
  const { data, error } = await query.select("id").single();
  if (error) throw new Error("Product save failed: " + error.message);
  if (!data?.id) throw new Error("Product was not saved. Please sign in again and retry.");
  revalidatePath("/admin/products"); revalidatePath("/mobiles"); revalidatePath("/");
  redirect("/admin/products?saved=" + (id ? "updated" : "created"));
}
export async function deleteProduct(formData:FormData){const {supabase}=await requireAdmin();const id=String(formData.get("id"));const {error}=await supabase.from("products").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",id);if(error)throw new Error(error.message);revalidatePath("/admin/products");}
export async function updateOrderStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"].includes(status)) throw new Error("Invalid status");
  const { data, error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("status").single();
  if (error) throw new Error(`Order update failed: ${error.message}`);
  if (data.status !== status) throw new Error("Order status did not change. Please sign in again and retry.");
  revalidatePath("/admin/orders");
  redirect(`/admin/orders?updated=${encodeURIComponent(status)}`);
}
export async function updateUsedRequest(formData:FormData){const {supabase}=await requireAdmin();const id=String(formData.get("id"));const status=String(formData.get("status"));const offer_price=Number(formData.get("offer_price"))||null;const {error}=await supabase.from("used_phone_requests").update({status,offer_price,admin_notes:String(formData.get("admin_notes")||""),updated_at:new Date().toISOString()}).eq("id",id);if(error)throw new Error(error.message);revalidatePath("/admin/used-phones");}
export async function saveStoreSettings(formData: FormData) {
  const { supabase } = await requireAdmin();
  const value = {
    name: String(formData.get("name") || "MobileHub").trim(),
    phone: String(formData.get("phone") || "").trim(),
    whatsapp: String(formData.get("whatsapp") || "").replace(/\D/g, ""),
    support_email: String(formData.get("support_email") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    delivery_fee: Math.max(0, Number(formData.get("delivery_fee")) || 0),
    free_delivery_threshold: Math.max(0, Number(formData.get("free_delivery_threshold")) || 0),
  };
  if (value.name.length < 2 || value.address.length < 3 || value.phone.length < 7) throw new Error("Complete the required store details.");
  const { error } = await supabase.from("site_settings").upsert({ key: "store", value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
