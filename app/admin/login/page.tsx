import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { login } from "./actions";

export default async function AdminLogin({ searchParams }:{ searchParams:Promise<{error?:string}> }) {
  const {error}=await searchParams;
  if(!hasSupabaseEnv) redirect("/admin/setup");
  return <main className="admin-login shell"><form action={login}><span className="kicker dark">STAFF ACCESS</span><h1>Admin login</h1><p>Sign in with an account whose profile role is set to <strong>admin</strong>.</p><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" required minLength={8}/></label>{error&&<p className="form-error">{error}</p>}<button className="primary-btn wide">Sign in</button></form></main>;
}
