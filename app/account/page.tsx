import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customerLogout, updateCustomerProfile } from "./actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");
  const [{ data: profile }, { data: orders, error: orderError }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone").eq("id", user.id).single(),
    supabase.from("orders").select("id,order_number,status,total,created_at,order_items(quantity,product_name,variant_label)").eq("user_id", user.id).order("created_at", { ascending: false })
  ]);
  if (orderError) throw new Error("Could not load order history: " + orderError.message);
  return <main className="account-page shell"><div className="account-heading"><div><span className="kicker dark">MY ACCOUNT</span><h1>Welcome, {profile?.full_name || "Customer"}</h1><p>{user.email}</p></div><form action={customerLogout}><button className="outline-btn">Sign out</button></form></div>{saved&&<p className="admin-success">Profile updated.</p>}{error&&<p className="form-error">{error}</p>}<div className="account-grid"><section className="account-card"><h2>Profile details</h2><form action={updateCustomerProfile}><label>Full name<input name="full_name" defaultValue={profile?.full_name || ""} required minLength={2}/></label><label>Pakistani phone<input name="phone" defaultValue={profile?.phone || ""} placeholder="03XX XXXXXXX"/></label><button className="primary-btn">Save details</button></form></section><section className="account-orders"><h2>Order history</h2>{orders?.length ? orders.map(order => <article key={order.id}><div><strong>{order.order_number}</strong><span className={"status status-" + order.status}>{order.status}</span></div><small>{new Date(order.created_at).toLocaleDateString("en-PK")} · Rs. {Number(order.total).toLocaleString("en-PK")}</small>{order.order_items.map(item => <p key={item.product_name + (item.variant_label || "")}>{item.quantity}× {item.product_name}{item.variant_label ? " — " + item.variant_label : ""}</p>)}<Link href={"/track-order?order=" + encodeURIComponent(order.order_number)}>Track order</Link></article>) : <div className="empty account-empty"><h3>No orders yet</h3><p>Orders placed while signed in will appear here.</p><Link href="/mobiles" className="primary-btn inline">Shop mobiles</Link></div>}</section></div></main>;
}