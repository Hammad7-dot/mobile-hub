"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, LockKey } from "@phosphor-icons/react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/products";
import Turnstile, { turnstileAvailable } from "@/components/Turnstile";

type Confirmation = { order_number: string; total: number; reservation_expires_at?: string };

export default function CheckoutClient({ deliveryFee, freeDeliveryThreshold }: { deliveryFee: number; freeDeliveryThreshold: number }) {
  const { items, clear } = useCart();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const grouped = useMemo(() => items.reduce<Record<string, number>>((a, item) => ({ ...a, [item.slug+"::"+(item.variant?.id||"default")]: (a[item.slug+"::"+(item.variant?.id||"default")] || 0) + 1 }), {}), [items]);
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, turnstile_token: turnstileToken, items: Object.entries(grouped).map(([key, quantity]) => { const [slug, variant_id] = key.split("::"); const item = items.find(line => line.slug === slug && (line.variant?.id || "default") === variant_id); return { slug, quantity, variant_id: variant_id === "default" ? undefined : variant_id, variant_label: item?.variant?.label }; }) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Order could not be placed");
      setConfirmation(result); clear();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Order could not be placed"); setTurnstileReset(value => value + 1); }
    finally { setBusy(false); }
  }

  if (confirmation) return <main className="form-page shell"><div className="success-card"><CheckCircle weight="fill"/><span className="kicker dark">ORDER RECEIVED</span><h1>Thank you for your order.</h1><p>Your order number is <strong>{confirmation.order_number}</strong>. Stock is reserved for 30 minutes while the store confirms your cash-on-delivery order. Save this number for tracking.</p><Link href="/track-order" className="primary-btn inline">Track your order</Link></div></main>;
  if (!items.length) return <main className="form-page shell"><div className="empty"><h1>Your cart is empty</h1><Link href="/mobiles" className="primary-btn inline">Browse mobiles</Link></div></main>;
  return <main className="form-page shell"><span className="kicker dark">SECURE CHECKOUT</span><h1>Delivery details</h1><div className="checkout-grid"><form className="checkout-form" onSubmit={submit}><div className="field-row"><label>Full name<input name="full_name" required minLength={2} placeholder="Your full name"/></label><label>Pakistani phone number<input name="phone" required pattern="(?:\+?92|0)?3[0-9]{9}" placeholder="03XX XXXXXXX"/></label></div><div className="field-row"><label>Email address<input name="email" type="email" placeholder="you@example.com"/></label><label>City<select name="city" required defaultValue=""><option value="" disabled>Select your city</option><option>Karachi</option><option>Lahore</option><option>Islamabad</option><option>Rawalpindi</option><option>Faisalabad</option><option>Multan</option><option>Peshawar</option><option>Other</option></select></label></div><label>Complete address<textarea name="address" required minLength={10} placeholder="House, street, area and nearby landmark"/></label><label>Order notes<textarea name="notes" maxLength={500} placeholder="Any delivery instructions?"/></label><div className="payment-choice"><span>Payment method</span><strong>● Cash on delivery</strong><small>Pay when your order arrives.</small></div><Turnstile action="checkout" onTokenChange={setTurnstileToken} resetKey={turnstileReset}/>{error && <p className="form-error">{error}</p>}<button disabled={busy || !turnstileAvailable || !turnstileToken} className="primary-btn wide"><LockKey/> {busy ? "Placing order…" : "Place order securely"}</button></form><aside className="summary-card"><h2>Your order</h2><div><span>{items.length} item{items.length===1?"":"s"}</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Delivery</span><strong>{subtotal >= freeDeliveryThreshold ? "Free" : formatPrice(deliveryFee)}</strong></div><div className="total"><span>Total</span><strong>{formatPrice(subtotal + (subtotal >= freeDeliveryThreshold ? 0 : deliveryFee))}</strong></div><small>Final prices and stock are verified securely before the order is created.</small></aside></div></main>;
}
