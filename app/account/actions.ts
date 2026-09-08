"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({ email: z.string().trim().email(), password: z.string().min(8).max(128) });
const signupSchema = credentialsSchema.extend({ full_name: z.string().trim().min(2).max(80) });

export async function customerLogin(formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/account/login?error=Enter+a+valid+email+and+password.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/account/login?error=" + encodeURIComponent(error.message));
  redirect("/account");
}

export async function customerSignup(formData: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/account/signup?error=Use+a+valid+name%2C+email%2C+and+password+of+at+least+8+characters.");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { full_name: parsed.data.full_name } } });
  if (error) redirect("/account/signup?error=" + encodeURIComponent(error.message));
  if (data.session) redirect("/account");
  redirect("/account/login?message=Check+your+email+to+confirm+your+account.");
}

export async function customerLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateCustomerProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").replace(/\D/g, "").replace(/^92/, "").replace(/^0/, "");
  if (full_name.length < 2 || (phone && !/^3\d{9}$/.test(phone))) redirect("/account?error=Enter+valid+profile+details.");
  const { error } = await supabase.from("profiles").update({ full_name, phone: phone || null, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) redirect("/account?error=" + encodeURIComponent(error.message));
  revalidatePath("/account");
  redirect("/account?saved=1");
}