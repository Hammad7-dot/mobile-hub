"use client";

import Link from "next/link";
import { CaretDown, List, MagnifyingGlass, ShoppingCart, UserCircle, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useCart } from "./CartProvider";
import type { StoreSettings } from "@/lib/settings";

export default function Navbar({ settings, signedIn }: { settings: StoreSettings; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;
  const closeMenu = () => setOpen(false);
  return <header className="market-header">
    <div className="market-top"><div className="shell"><span>Pakistan&apos;s trusted mobile price & shopping portal</span><nav><Link href="/track-order">Track Order</Link><a href={phoneHref}>Customer Support</a><span>Call: {settings.phone}</span></nav></div></div>
    <div className="market-main shell">
      <Link href="/" className="market-logo"><span>{settings.name}</span></Link>
      <form className="market-search" action="/mobiles"><select name="category" aria-label="Category"><option>Mobiles</option></select><input name="q" placeholder="Search for mobiles, brands and specifications..."/><button aria-label="Search"><MagnifyingGlass weight="bold"/></button></form>
      <div className="market-actions"><Link href={signedIn?"/account":"/account/login"}><UserCircle/><span>{signedIn?"Account":"Sign in"}</span></Link><Link href="/cart" className="market-cart"><ShoppingCart/><span>Cart</span>{count > 0 && <b>{count}</b>}</Link><button type="button" className="menu" onClick={() => setOpen(current => !current)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X/> : <List/>}</button></div>
    </div>
    <div id="mobile-navigation" className={`category-nav ${open ? "open" : ""}`}><nav className="shell" onClick={closeMenu}><Link href="/mobiles" className="all-cats"><List weight="bold"/> All Mobiles <CaretDown/></Link><Link href="/mobiles">Mobiles</Link><Link href="/track-order">Track Order</Link><Link href="/sell-phone" className="sell-link">Sell Your Phone</Link></nav></div>
  </header>;
}
