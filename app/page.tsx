import Link from "next/link";
import { ArrowRight, DeviceMobile, Headphones, Laptop, ShieldCheck, ShoppingBag, Storefront, Watch } from "@phosphor-icons/react/dist/ssr";
import PhoneArt from "@/components/PhoneArt";
import ProductCard from "@/components/ProductCard";
import { brands } from "@/lib/products";
import { getProducts } from "@/lib/catalog";

const priceGroups = [
  { title: "Mobiles Under 30,000", min: 0, max: 30000 },
  { title: "30,000 – 50,000", min: 30000, max: 50000 },
  { title: "50,000 – 100,000", min: 50000, max: 100000 }
];

export default async function Home() {
  const products = await getProducts();
  return <main className="market-home">
    <section className="market-hero shell"><aside className="hero-categories"><h3>Shop by brand</h3>{brands.map(brand => <Link key={brand} href={`/mobiles?brand=${brand}`}><span>{brand.charAt(0)}</span>{brand}<ArrowRight/></Link>)}</aside><div className="hero-banner"><div className="hero-message"><span className="sale-label">NEW ARRIVALS 2026</span><h1>Upgrade your world.<br/><em>Pay the right price.</em></h1><p>Latest PTA-approved smartphones with official warranty and nationwide cash on delivery.</p><div><Link href="/mobiles" className="primary-btn inline">Shop mobiles</Link><Link href="/mobiles?max=50000" className="outline-btn">Under Rs. 50K</Link></div></div><div className="market-phone"><PhoneArt color="#d8ba72"/></div><div className="discount-burst"><strong>10%</strong><span>OFF</span></div></div><div className="side-promos"><Link href="/mobiles?brand=Apple"><span>PREMIUM PICKS</span><h3>iPhone<br/>Collection</h3><small>Shop now →</small></Link><Link href="/mobiles?max=50000"><span>BEST VALUE</span><h3>Budget<br/>Champions</h3><small>From Rs. 28,999 →</small></Link></div></section>

    <section className="quick-categories shell"><Link href="/mobiles"><i><DeviceMobile/></i><span><strong>Mobiles</strong><small>12+ products</small></span></Link><a href="#laptops"><i><Laptop/></i><span><strong>Laptops</strong><small>Coming soon</small></span></a><a href="#smart-watches"><i><Watch/></i><span><strong>Smart Watches</strong><small>Coming soon</small></span></a><a href="#earbuds"><i><Headphones/></i><span><strong>Earbuds</strong><small>Coming soon</small></span></a><a href="#accessories"><i><ShoppingBag/></i><span><strong>Accessories</strong><small>Coming soon</small></span></a></section>

    <section className="market-section shell"><div className="market-title"><div><span>Fresh in the market</span><h2>Latest Mobiles</h2></div><Link href="/mobiles">View all <ArrowRight/></Link></div><div className="product-grid dense-grid">{products.slice(0,8).map(product => <ProductCard key={product.slug} product={product}/>)}</div></section>

    <section className="service-strip"><div className="shell"><div><ShieldCheck/><span><strong>100% Original</strong><small>Authentic devices only</small></span></div><div><Storefront/><span><strong>Best Market Price</strong><small>Transparent PKR pricing</small></span></div><div><ShoppingBag/><span><strong>Cash on Delivery</strong><small>Available Pakistan-wide</small></span></div><div><Headphones/><span><strong>Customer Support</strong><small>Help before and after sale</small></span></div></div></section>

    {priceGroups.map(group => { const matches = products.filter(p => p.price > group.min && p.price <= group.max); return matches.length > 0 && <section className="market-section shell price-shelf" key={group.title}><div className="market-title"><div><span>Shop according to your budget</span><h2>{group.title}</h2></div><Link href={`/mobiles?max=${group.max}`}>View all <ArrowRight/></Link></div><div className="product-grid dense-grid">{matches.slice(0,4).map(product => <ProductCard key={product.slug} product={product}/>)}</div></section> })}

    <section className="market-section upcoming-wrap"><div className="shell"><div className="market-title light-title"><div><span>Launching soon in Pakistan</span><h2>Upcoming Mobiles</h2></div><Link href="/mobiles">Explore all <ArrowRight/></Link></div><div className="upcoming-grid">{products.filter(p=>p.isNew).slice(0,4).map((p,i)=><Link href={`/mobiles/${p.slug}`} key={p.slug}><div className="upcoming-art"><PhoneArt color={p.color} small/></div><span>Expected {i%2 ? "October" : "September"} 2026</span><h3>{p.name}</h3><strong>Expected Rs. {p.price.toLocaleString("en-PK")}</strong></Link>)}</div></div></section>

    <section className="market-section shell portal-copy"><span className="section-label">MOBILE PRICE IN PAKISTAN</span><h2>Research, compare, buy and sell—all in one place.</h2><div><p>MobileHub is built to make phone shopping in Pakistan easier. Browse current prices, compare essential specifications, explore popular brands, and discover phones for every budget without jumping between dozens of websites.</p><p>Every listing clearly shows RAM, storage, camera, battery, PTA status and warranty information. Our marketplace experience is powered by original Next.js code and designed around the needs of local buyers.</p></div><div className="portal-links"><Link href="/mobiles">Browse all mobiles</Link><Link href="/mobiles?brand=Samsung">Samsung prices</Link><Link href="/mobiles?brand=Apple">iPhone prices</Link><Link href="/mobiles?max=50000">Phones under 50K</Link></div></section>
  </main>;
}
