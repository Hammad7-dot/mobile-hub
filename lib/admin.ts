import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function requireAdmin(){
  if(!hasSupabaseEnv) redirect("/admin/setup");
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/admin/login");
  const {data:profile}=await supabase.from("profiles").select("role,full_name").eq("id",user.id).single();
  if(profile?.role!=="admin") redirect("/admin/login?error=Administrator%20access%20required");
  return {supabase,user,profile};
}
