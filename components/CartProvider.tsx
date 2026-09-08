"use client";
import { createContext,useContext,useEffect,useMemo,useState } from "react";
import type { Product, ProductVariant } from "@/lib/products";

export type CartLine=Pick<Product,"slug"|"name"|"brand"|"price"|"ram"|"storage"|"color"|"images"> & { variant?: ProductVariant };
type CartContextType={items:CartLine[];add:(product:CartLine)=>void;remove:(lineKey:string)=>void;clear:()=>void;count:number};
const CartContext=createContext<CartContextType|null>(null);
export function CartProvider({children}:{children:React.ReactNode}){const[items,setItems]=useState<CartLine[]>([]);useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("mobilehub-cart")||"[]");if(Array.isArray(saved)&&saved.every(item=>item&&typeof item==="object"&&"slug" in item))queueMicrotask(()=>setItems(saved))}catch{}},[]);useEffect(()=>{localStorage.setItem("mobilehub-cart",JSON.stringify(items))},[items]);const value=useMemo(()=>({items,add:(product:CartLine)=>setItems(value=>[...value,product]),remove:(lineKey:string)=>setItems(value=>{const index=value.findIndex(item=>(item.slug+"::"+(item.variant?.id||"default"))===lineKey);return index<0?value:[...value.slice(0,index),...value.slice(index+1)]}),clear:()=>setItems([]),count:items.length}),[items]);return <CartContext.Provider value={value}>{children}</CartContext.Provider>}
export function useCart(){const value=useContext(CartContext);if(!value)throw new Error("useCart must be inside CartProvider");return value}
