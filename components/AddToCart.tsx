"use client";
import { ShoppingBag } from "@phosphor-icons/react";
import type { Product } from "@/lib/products";
import { useCart } from "./CartProvider";
export default function AddToCart({product}:{product:Product}){const{add}=useCart();return <button className="primary-btn wide" onClick={()=>add(product)}><ShoppingBag weight="bold"/> Add to cart</button>}
