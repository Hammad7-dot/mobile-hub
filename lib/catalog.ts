import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { products as fallbackProducts, type Product } from "@/lib/products";

type ProductRow = {
  slug: string; name: string; sku: string | null; description: string; price: number;
  compare_at_price: number | null; stock: number; featured: boolean; status: string;
  pta_approved: boolean; warranty: string; specifications: Record<string, string>;
  images: string[]; variants: import("@/lib/products").ProductVariant[]; brands: { name: string } | { name: string }[] | null;
};

const bundledImages: Record<string, string[]> = { "xiaomi-redmi-note-14-pro": ["/products/xiaomi-redmi-note-14-pro.webp"] };

function mapProduct(row: ProductRow): Product {
  const brand = Array.isArray(row.brands) ? row.brands[0]?.name : row.brands?.name;
  const specs = row.specifications || {};
  const variants = Array.isArray(row.variants) ? row.variants.map((variant, index) => {
    const ram = String(variant.ram || specs.ram || "");
    const storage = String(variant.storage || "");
    const color = String(variant.color || "");
    const label = String(variant.label || [ram, storage, color].filter(Boolean).join(" · "));
    const generatedId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { id: String(variant.id || generatedId || `${row.slug}-${index + 1}`), ram, storage, color, label };
  }).filter((variant, index, list) => list.findIndex(item => item.id === variant.id) === index) : [];
  return {
    slug: row.slug, name: row.name, brand: brand || "Other", price: Number(row.price),
    oldPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    ram: specs.ram || "—", storage: specs.storage || "—", display: specs.display || "—",
    processor: specs.processor || "—", camera: specs.camera || "—",
    battery: specs.battery || "—", os: specs.os || "—", color: "#d8ba72",
    images: row.images?.length ? row.images : (bundledImages[row.slug] || []), variants, featured: row.featured, isNew: row.status === "upcoming",
    description: row.description, stock: row.stock, ptaApproved: row.pta_approved,
    warranty: row.warranty, sku: row.sku || undefined
  };
}

export async function getProducts() {
  if (!hasSupabaseEnv) return fallbackProducts;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("products").select("slug,name,sku,description,price,compare_at_price,stock,featured,status,pta_approved,warranty,specifications,images,variants,brands(name)").in("status", ["active", "upcoming"]).order("created_at", { ascending: false });
    if (error || !data?.length) return fallbackProducts;
    return (data as unknown as ProductRow[]).map(mapProduct);
  } catch {
    return fallbackProducts;
  }
}

export async function getProductBySlug(slug: string) {
  const catalog = await getProducts();
  return catalog.find(product => product.slug === slug);
}