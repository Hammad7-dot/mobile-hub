import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, ShieldCheck, Truck } from "@phosphor-icons/react/dist/ssr";
import PhoneArt from "@/components/PhoneArt";
import AddToCart from "@/components/AddToCart";
import { formatPrice, products } from "@/lib/products";
import { getProductBySlug } from "@/lib/catalog";

export function generateStaticParams() { return products.map(p => ({ slug: p.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = await getProductBySlug(slug); if (!product) notFound();
  const specs = [["Display",product.display],["Processor",product.processor],["RAM",product.ram],["Storage",product.storage],["Rear camera",product.camera],["Battery",product.battery],["Operating system",product.os],["Network","5G / 4G LTE"]];
  return <main className="detail shell"><div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/mobiles">Mobiles</Link> / {product.name}</div><div className="detail-grid"><div className="detail-gallery"><div className="detail-visual"><span className="badge">PTA APPROVED</span>{product.images?.[0]?<Image className="product-photo detail-photo" src={product.images[0]} alt={product.name} fill sizes="(max-width: 900px) 90vw, 550px" priority/>:<PhoneArt color={product.color}/>}</div>{product.images&&product.images.length>1&&<div className="detail-thumbnails">{product.images.map((image,index)=><div key={image}><Image src={image} alt={`${product.name} view ${index+1}`} fill sizes="80px"/></div>)}</div>}</div><div className="detail-copy"><span className="eyebrow">{product.brand}</span><h1>{product.name}</h1><div className="sku">★★★★★ <span>4.9 · 28 reviews</span></div><div className="detail-price">{formatPrice(product.price)} {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}</div><div className="availability"><CheckCircle weight="fill"/> In stock — ready to dispatch</div><p className="summary">A refined, dependable smartphone with a vivid display, excellent everyday performance and a camera made for the moments that matter.</p><div className="quick-specs"><span><small>RAM</small><strong>{product.ram}</strong></span><span><small>STORAGE</small><strong>{product.storage}</strong></span><span><small>BATTERY</small><strong>{product.battery}</strong></span></div><AddToCart product={product}/><div className="purchase-notes"><span><Truck/> Nationwide delivery</span><span><ShieldCheck/> 1 year warranty</span></div></div></div>
    <section className="spec-section"><span className="kicker dark">EVERY DETAIL</span><h2>Specifications</h2><div className="spec-grid">{specs.map(([key,value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div></section>
  </main>;
}
