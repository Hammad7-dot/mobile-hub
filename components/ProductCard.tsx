"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { Product, formatPrice } from "@/lib/products";
import PhoneArt from "./PhoneArt";

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images?.[0];
  return <Link href={`/mobiles/${product.slug}`} className="product-card">
    <div className="product-visual">{product.isNew && <span className="badge">NEW</span>}{primaryImage ? <Image className="product-photo" src={primaryImage} alt={product.name} fill sizes="(max-width: 560px) 90vw, (max-width: 900px) 45vw, 280px"/> : <PhoneArt color={product.color} small/>}</div>
    <div className="product-copy"><span className="eyebrow">{product.brand}</span><h3>{product.name}</h3><div className="mini-specs"><span>{product.ram} RAM</span><span>{product.storage}</span></div>
    <div className={product.stock===0?"stock out-of-stock":"stock"}><CheckCircle weight="fill"/> {product.ptaApproved===false?"Non-PTA":"PTA approved"} · {product.stock===0?"Out of stock":typeof product.stock==="number"?product.stock+" available":"In stock"}</div><div className="price-row"><div><strong>{formatPrice(product.price)}</strong>{product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}</div><span className="product-arrow" aria-hidden="true"><ArrowRight/></span></div></div>
  </Link>;
}