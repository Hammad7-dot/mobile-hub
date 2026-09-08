import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { checkoutSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv) return NextResponse.json({ error: "Database is not connected yet. Add the Supabase environment variables first." }, { status: 503 });
  try {
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid order" }, { status: 400 });
    const supabase = await createClient();
    const slugs = parsed.data.items.map(item => item.slug);
    const { data: productRows, error: productError } = await supabase.from("products").select("id,slug").in("slug", slugs).eq("status", "active");
    if (productError || !productRows || productRows.length !== new Set(slugs).size) return NextResponse.json({ error: "One or more products are unavailable." }, { status: 409 });
    const databaseItems = parsed.data.items.map(item => ({ product_id: productRows.find(row => row.slug === item.slug)!.id, variant_id: item.variant_id, variant_label: item.variant_label, quantity: item.quantity }));
    const customer = { full_name: parsed.data.full_name, phone: parsed.data.phone, email: parsed.data.email, city: parsed.data.city, address: parsed.data.address, notes: parsed.data.notes };
    const { data, error } = await supabase.rpc("place_order", { customer, items: databaseItems });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to place the order." }, { status: 500 }); }
}
