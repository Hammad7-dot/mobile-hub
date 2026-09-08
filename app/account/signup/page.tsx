import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customerSignup } from "../actions";

export default async function CustomerSignup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/account");
  return <main className="account-auth shell"><form action={customerSignup}><span className="kicker dark">JOIN MOBILEHUB</span><h1>Create account</h1>{error&&<p className="form-error">{error}</p>}<label>Full name<input name="full_name" minLength={2} autoComplete="name" required/></label><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required/><small>At least 8 characters.</small></label><button className="primary-btn wide">Create account</button><small>Already registered? <Link href="/account/login">Sign in</Link></small></form></main>;
}