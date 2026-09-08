import Link from "next/link";

export default function Footer() {
  return <footer><div className="shell footer-grid">
    <div><Link href="/" className="logo light"><span>M</span>obileHub</Link><p>Your trusted destination for authentic smartphones, honest prices and dependable delivery across Pakistan.</p></div>
    <div><h4>Shop</h4><Link href="/mobiles">All mobiles</Link><Link href="/mobiles?brand=Samsung">Samsung</Link><Link href="/mobiles?brand=Apple">Apple</Link><Link href="/mobiles?brand=Xiaomi">Xiaomi</Link></div>
    <div><h4>Help</h4><Link href="/cart">Your cart</Link><Link href="/track-order">Track order</Link><a href="#">Returns & warranty</a><a href="#">Contact us</a></div>
    <div><h4>Stay in the loop</h4><p>New launches, price drops and honest picks—straight to your inbox.</p><div className="newsletter"><input placeholder="Your email address"/><button>Join</button></div></div>
  </div><div className="shell footer-bottom"><span>© 2026 MobileHub. All rights reserved.</span><span>Built for Pakistan 🇵🇰</span></div></footer>;
}
