import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { trackingSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv) return NextResponse.json({ error: "Database is not connected yet." }, { status: 503 });
  const parsed = trackingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid tracking details" }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("track_order", { order_no: parsed.data.order_number, customer_phone: parsed.data.phone });
  if (error) return NextResponse.json({ error: "Unable to track this order." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "No matching order was found." }, { status: 404 });
  return NextResponse.json(data);
}
