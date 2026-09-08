"use client";
import { useState } from "react";
import { ShoppingBag } from "@phosphor-icons/react";
import type { Product, ProductVariant } from "@/lib/products";
import { useCart } from "./CartProvider";

export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const variant = product.variants?.find(item => item.id === variantId);
  const selected = variant ? { ...product, ram: variant.ram || product.ram, storage: variant.storage || product.storage, variant } : product;
  return <div className="purchase-actions">{product.variants?.length ? <label className="variant-picker">Choose variant<select value={variantId} onChange={event => setVariantId(event.target.value)}>{product.variants.map((item: ProductVariant, index) => <option value={item.id} key={`${item.id}-${index}`}>{item.label}</option>)}</select></label> : null}<button className="primary-btn wide" onClick={() => add(selected)}><ShoppingBag weight="bold"/> Add to cart</button></div>;
}