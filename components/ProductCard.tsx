"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Heart } from "@phosphor-icons/react";
import { Product, formatPrice } from "@/lib/products";
import PhoneArt from "./PhoneArt";

export default function ProductCard({ product }: { product: Product }) {
  return <article className="product-card">
    <div className="product-visual">{product.isNew && <span className="badge">NEW</span>}<button className="wish" aria-label="Add to wishlist"><Heart/></button><PhoneArt color={product.color} small/></div>
    <div className="product-copy"><span className="eyebrow">{product.brand}</span><h3><Link href={`/mobiles/${product.slug}`}>{product.name}</Link></h3><div className="mini-specs"><span>{product.ram} RAM</span><span>{product.storage}</span></div>
    <div className="stock"><CheckCircle weight="fill"/> PTA approved · In stock</div><div className="price-row"><div><strong>{formatPrice(product.price)}</strong>{product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}</div><Link href={`/mobiles/${product.slug}`} aria-label={`View ${product.name}`}><ArrowRight/></Link></div></div>
  </article>;
}
