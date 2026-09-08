import Link from "next/link";
import type { StoreSettings } from "@/lib/settings";

export default function Footer({ settings }: { settings: StoreSettings }) {
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;
  const whatsappHref = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`;
  return <footer><div className="shell footer-grid">
    <div><Link href="/" className="logo light"><span>M</span>{settings.name}</Link><p>Your trusted destination for authentic smartphones, honest prices and dependable delivery across Pakistan.</p><small>{settings.address}</small></div>
    <div><h4>Shop</h4><Link href="/mobiles">All mobiles</Link><Link href="/mobiles?brand=Samsung">Samsung</Link><Link href="/mobiles?brand=Apple">Apple</Link><Link href="/mobiles?brand=Xiaomi">Xiaomi</Link></div>
    <div><h4>Help</h4><Link href="/cart">Your cart</Link><Link href="/track-order">Track order</Link><a href={phoneHref}>Call support</a><a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a></div>
    <div><h4>Contact</h4><p>{settings.phone}</p>{settings.support_email&&<a href={`mailto:${settings.support_email}`}>{settings.support_email}</a>}<p>Free delivery above Rs. {Number(settings.free_delivery_threshold).toLocaleString("en-PK")}</p></div>
  </div><div className="shell footer-bottom"><span>© 2026 {settings.name}. All rights reserved.</span><span>Built for Pakistan 🇵🇰</span></div></footer>;
}
