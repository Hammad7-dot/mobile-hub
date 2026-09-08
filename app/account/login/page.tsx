import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customerLogin } from "../actions";

export default async function CustomerLogin({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { error, message } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/account");
  return <main className="account-auth shell"><form action={customerLogin}><span className="kicker dark">CUSTOMER ACCOUNT</span><h1>Sign in</h1><p>View your orders and manage your details.</p>{message&&<p className="admin-success">{message}</p>}{error&&<p className="form-error">{error}</p>}<label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label><button className="primary-btn wide">Sign in</button><small>New customer? <Link href="/account/signup">Create an account</Link></small></form></main>;
}