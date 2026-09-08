"use client";

import Link from "next/link";
import { CaretDown, Heart, List, MagnifyingGlass, ShoppingCart, UserCircle, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useCart } from "./CartProvider";

const categories = ["Mobiles", "Laptops", "Tablets", "Smart Watches", "Accessories", "Gaming", "Earbuds"];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return <header className="market-header">
    <div className="market-top"><div className="shell"><span>Pakistan&apos;s trusted mobile price & shopping portal</span><nav><Link href="/track-order">Track Order</Link><a href="#support">Customer Support</a><span>Call: +92 300 1234567</span></nav></div></div>
    <div className="market-main shell">
      <Link href="/" className="market-logo"><span>Mobile</span><b>Hub</b><small>.pk</small></Link>
      <form className="market-search" action="/mobiles"><select name="category" aria-label="Category"><option>All Categories</option><option>Mobiles</option><option>Accessories</option></select><input name="q" placeholder="Search for mobiles, brands and specifications..."/><button aria-label="Search"><MagnifyingGlass weight="bold"/></button></form>
      <div className="market-actions"><a href="#wishlist"><Heart/><span>Wishlist</span></a><a href="#account"><UserCircle/><span>Account</span></a><Link href="/cart" className="market-cart"><ShoppingCart/><span>Cart</span>{count > 0 && <b>{count}</b>}</Link><button className="menu" onClick={() => setOpen(!open)}>{open ? <X/> : <List/>}</button></div>
    </div>
    <div className={`category-nav ${open ? "open" : ""}`}><nav className="shell"><Link href="/mobiles" className="all-cats"><List weight="bold"/> All Categories <CaretDown/></Link>{categories.map(c=><Link key={c} href={c === "Mobiles" ? "/mobiles" : `/#${c.toLowerCase().replaceAll(" ", "-")}`}>{c}</Link>)}<Link href="/sell-phone" className="sell-link">Sell Your Phone</Link></nav></div>
  </header>;
}
