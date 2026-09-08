import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const formData = await request.formData();
  const slug = String(formData.get("slug") || "product").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 100);
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (!files.length || files.length > 6) return NextResponse.json({ error: "Select between 1 and 6 images." }, { status: 400 });

  for (const file of files) {
    if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed." }, { status: 400 });
    if (file.size > maxFileSize) return NextResponse.json({ error: `${file.name} is larger than 5 MB.` }, { status: 400 });
  }

  const urls: string[] = [];
  const uploadedPaths: string[] = [];
  for (const file of files) {
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `products/${slug}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) {
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    uploadedPaths.push(path);
    urls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
  }
  return NextResponse.json({ urls }, { status: 201 });
}
