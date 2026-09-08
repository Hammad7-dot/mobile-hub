import ProductCard from "@/components/ProductCard";
import { brands } from "@/lib/products";
import { getProducts } from "@/lib/catalog";

export default async function MobilesPage({ searchParams }: { searchParams: Promise<{ q?: string; brand?: string; max?: string }> }) {
  const params = await searchParams;
  const products = await getProducts();
  const q = (params.q || "").toLowerCase();
  const max = Number(params.max || 0);
  const filtered = products.filter(p => (!q || `${p.name} ${p.brand} ${p.ram} ${p.storage}`.toLowerCase().includes(q)) && (!params.brand || p.brand === params.brand) && (!max || p.price <= max));
  return <main className="catalog shell"><div className="catalog-title"><span className="kicker dark">FIND YOUR NEXT PHONE</span><h1>Mobiles in Pakistan</h1><p>Compare specifications and discover the right device for your budget.</p></div>
    <div className="catalog-layout"><aside><form><label>Search<input name="q" defaultValue={params.q} placeholder="Phone or brand..."/></label><label>Brand<select name="brand" defaultValue={params.brand || ""}><option value="">All brands</option>{brands.map(b => <option key={b}>{b}</option>)}</select></label><label>Maximum price<select name="max" defaultValue={params.max || ""}><option value="">Any price</option><option value="30000">Rs. 30,000</option><option value="50000">Rs. 50,000</option><option value="100000">Rs. 100,000</option><option value="200000">Rs. 200,000</option></select></label><button className="primary-btn">Apply filters</button></form></aside><div><div className="result-line"><strong>{filtered.length} phones</strong><span>Prices include applicable taxes</span></div><div className="product-grid catalog-grid">{filtered.map(p => <ProductCard key={p.slug} product={p}/>)}</div>{filtered.length === 0 && <div className="empty"><h2>No phones found</h2><p>Try removing a filter or searching for another model.</p></div>}</div></div>
  </main>;
}
