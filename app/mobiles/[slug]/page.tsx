import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, ShieldCheck, Truck } from "@phosphor-icons/react/dist/ssr";
import AddToCart from "@/components/AddToCart";
import { formatPrice, products } from "@/lib/products";
import { getProductBySlug } from "@/lib/catalog";

export function generateStaticParams() { return products.map(p => ({ slug: p.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = await getProductBySlug(slug); if (!product) notFound();
  const specs = [["Display",product.display],["Processor",product.processor],["RAM",product.ram],["Storage",product.storage],["Rear camera",product.camera],["Battery",product.battery],["Operating system",product.os]];
  return <main className="detail shell"><div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/mobiles">Mobiles</Link> / {product.name}</div><div className="detail-grid"><div className="detail-gallery"><div className="detail-visual">{product.ptaApproved&&<span className="badge">PTA APPROVED</span>}{product.images?.[0]?<Image className="product-photo detail-photo" src={product.images[0]} alt={product.name} fill sizes="(max-width: 900px) 90vw, 550px" priority/>:<span className="detail-image-unavailable">Product image not uploaded</span>}</div>{product.images&&product.images.length>1&&<div className="detail-thumbnails">{product.images.map((image,index)=><div key={image}><Image src={image} alt={`${product.name} view ${index+1}`} fill sizes="80px"/></div>)}</div>}</div><div className="detail-copy"><span className="eyebrow">{product.brand}</span><h1>{product.name}</h1>{product.sku&&<div className="sku">SKU: {product.sku}</div>}<div className="detail-price">{formatPrice(product.price)} {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}</div><div className="availability"><CheckCircle weight="fill"/> {typeof product.stock==="number"?(product.stock>0?product.stock+" in stock":"Out of stock"):"Availability on request"}</div>{product.description&&<p className="summary">{product.description}</p>}<div className="quick-specs"><span><small>RAM</small><strong>{product.ram}</strong></span><span><small>STORAGE</small><strong>{product.storage}</strong></span><span><small>BATTERY</small><strong>{product.battery}</strong></span></div><AddToCart product={product}/><div className="purchase-notes"><span><Truck/> Nationwide delivery</span>{product.warranty&&<span><ShieldCheck/> {product.warranty} warranty</span>}</div></div></div>
    <section className="spec-section"><span className="kicker dark">EVERY DETAIL</span><h2>Specifications</h2><div className="spec-grid">{specs.map(([key,value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div></section>
  </main>;
}
