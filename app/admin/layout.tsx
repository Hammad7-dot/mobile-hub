import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { logout } from "./login/actions";

export default function AdminLayout({children}:{children:React.ReactNode}){return <div className="admin-shell">{hasSupabaseEnv&&<aside className="admin-nav"><Link href="/admin" className="market-logo"><span>Mobile</span><b>Hub</b></Link><small>ADMINISTRATION</small><nav><Link href="/admin">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/used-phones">Used phones</Link><Link href="/admin/settings">Settings</Link><Link href="/">View storefront</Link></nav><form action={logout}><button>Sign out</button></form></aside>}<div className="admin-content">{children}</div></div>}
