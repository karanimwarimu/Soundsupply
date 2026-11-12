import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { ArrowDownRight, ArrowLeft, ArrowRight, AudioLines, BadgeCheck, Cable, Check, ChevronDown, ChevronRight, CircleHelp, Disc3, Headphones, Menu, Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Speaker, Star, Truck, UserRound, X } from 'lucide-react';

type Product = { id: string; name: string; category: string; description: string; price: number; compareAtPrice?: number; image: string; imageUrl?: string; rating: number; reviewCount: number; stock: number; badge?: string; paymentType: 'one-time' | 'subscription' };
type CartItem = { productId: string; quantity: number };
type Order = { id: string; customerName: string; customerEmail: string; total: number; status: string; createdAt: string; items: CartItem[] };

const starterProducts: Product[] = [
  { id: 'field-notes-headphones', name: 'Field Notes Closed-Back Headphones', category: 'Headphones', description: 'A quietly detailed listening headphone built for long sessions. Replaceable pads, a coiled studio cable, and a balanced sound that keeps the music in focus.', price: 189, compareAtPrice: 229, image: 'headphones', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85', rating: 4.8, reviewCount: 42, stock: 18, badge: 'Staff pick', paymentType: 'one-time' },
  { id: 'little-signal-speaker', name: 'Little Signal Bookshelf Speakers', category: 'Speakers', description: 'Small-footprint speakers with a surprisingly broad, natural image. Thoughtful cabinet damping and easy placement make them a great first hi-fi pair.', price: 349, image: 'speaker', imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=85', rating: 4.7, reviewCount: 28, stock: 9, badge: 'Just in', paymentType: 'one-time' },
  { id: 'orbit-turntable', name: 'Orbit Manual Turntable', category: 'Turntables', description: 'A low-fuss manual deck for records you actually want to sit down and hear. Precision belt drive, a pre-aligned cartridge, and a solid plinth.', price: 429, compareAtPrice: 499, image: 'turntable', imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=1000&q=85', rating: 4.9, reviewCount: 36, stock: 6, badge: 'Save $70', paymentType: 'one-time' },
  { id: 'quiet-current-dac', name: 'Quiet Current USB DAC', category: 'Hi-fi components', description: 'Give a laptop or desktop a cleaner path to your headphones or amp. One compact box, carefully chosen components, no setup rituals.', price: 129, image: 'dac', imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=85', rating: 4.6, reviewCount: 19, stock: 24, paymentType: 'one-time' },
  { id: 'everyday-usbc', name: 'Everyday USB-C Audio Cable', category: 'Cables & power', description: 'A flexible, properly shielded cable with a soft-touch jacket and reinforced ends. Made to disappear behind your desk and keep working.', price: 24, image: 'cable', imageUrl: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=1000&q=85', rating: 4.5, reviewCount: 64, stock: 51, badge: 'Under $30', paymentType: 'one-time' },
  { id: 'studio-monitor-one', name: 'Studio Monitor One', category: 'Speakers', description: 'Active nearfield monitors with honest midrange and a broad listening sweet spot. A considered choice for home studios and compact rooms.', price: 279, image: 'monitor', imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=85', rating: 4.7, reviewCount: 16, stock: 11, paymentType: 'one-time' },
  { id: 'open-air-wireless', name: 'Open Air Wireless Headphones', category: 'Headphones', description: 'Easy, all-day wireless listening with a comfortable over-ear fit, clear calls, and a warm sound for work or winding down.', price: 149, compareAtPrice: 179, image: 'headphones', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=85', rating: 4.7, reviewCount: 31, stock: 14, badge: 'Everyday favorite', paymentType: 'one-time' },
  { id: 'listening-room-amp', name: 'Listening Room Integrated Amp', category: 'Hi-fi components', description: 'A compact integrated amplifier with straightforward connections and enough room to grow into a thoughtful two-channel setup.', price: 549, image: 'dac', imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=85', rating: 4.8, reviewCount: 22, stock: 5, badge: 'Small batch', paymentType: 'one-time' },
  { id: 'needle-and-groove-kit', name: 'Needle & Groove Record Care Kit', category: 'Turntables', description: 'Keep records and stylus in good shape with a carbon-fiber brush, stylus brush, and gentle cleaning essentials.', price: 39, image: 'turntable', imageUrl: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=1000&q=85', rating: 4.6, reviewCount: 57, stock: 32, badge: 'Under $50', paymentType: 'one-time' },
  { id: 'desktop-dac-plus', name: 'Desktop DAC Plus', category: 'Hi-fi components', description: 'A small desktop upgrade for headphones and powered speakers, with simple controls and a clean, low-noise signal path.', price: 219, image: 'dac', imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=85', rating: 4.7, reviewCount: 18, stock: 12, paymentType: 'one-time' },
  { id: 'balanced-interconnects', name: 'Balanced Interconnect Pair', category: 'Cables & power', description: 'A durable, flexible stereo cable pair with secure connectors for a tidy, dependable home audio setup.', price: 59, image: 'cable', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85', rating: 4.5, reviewCount: 26, stock: 40, paymentType: 'one-time' },
  { id: 'nearfield-stands', name: 'Nearfield Monitor Stands', category: 'Speakers', description: 'A stable pair of compact desktop stands that helps position small monitors at a comfortable listening height.', price: 89, image: 'monitor', imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=85', rating: 4.6, reviewCount: 13, stock: 8, paymentType: 'one-time' },
];

const categoryLinks = [
  { label: 'Headphones', slug: 'headphones', icon: Headphones, desc: 'Find your listening fit' },
  { label: 'Speakers', slug: 'speakers', icon: Speaker, desc: 'Bring the room to life' },
  { label: 'Turntables', slug: 'turntables', icon: Disc3, desc: 'Start with the record' },
  { label: 'Hi-fi components', slug: 'hi-fi-components', icon: AudioLines, desc: 'Build your system' },
  { label: 'Cables & power', slug: 'cables-power', icon: Cable, desc: 'The right connection' },
];
const sampleOrders: Order[] = [
  { id: 'SS-1048', customerName: 'Morgan Ellis', customerEmail: 'morgan@example.net', total: 213, status: 'In transit', createdAt: 'May 18, 2025', items: [{ productId: 'field-notes-headphones', quantity: 1 }, { productId: 'everyday-usbc', quantity: 1 }] },
  { id: 'SS-1031', customerName: 'Jamie Chen', customerEmail: 'jamie@example.net', total: 429, status: 'Delivered', createdAt: 'May 12, 2025', items: [{ productId: 'orbit-turntable', quantity: 1 }] },
];
const queryClient = new QueryClient();
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const readStorage = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};

function ProductArtwork({ product, large = false }: { product: Product; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Graphic = product.image === 'headphones' ? Headphones : product.image === 'speaker' || product.image === 'monitor' ? Speaker : product.image === 'turntable' ? Disc3 : product.image === 'cable' ? Cable : AudioLines;
  return <div className={`artwork artwork-${product.image}${large ? ' artwork-large' : ''}`} aria-label={`${product.name} product illustration`}>
    {product.imageUrl && !imageFailed && <img className="artwork-photo" src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setImageFailed(true)}/>}
    <span className="artwork-index">SS / {product.id.slice(0, 2).toUpperCase()}</span>
    {(!product.imageUrl || imageFailed) && <Graphic strokeWidth={1.05} />}
    <span className="artwork-caption">{product.category} / SIGNAL SUPPLY</span>
  </div>;
}

function Header({ count, searchText, setSearchText }: { count: number; searchText: string; setSearchText: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const submit = (e: FormEvent) => { e.preventDefault(); navigate('/'); document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }); };
  return <>
    <div className="top-strip"><span>Good gear, chosen by people who use it.</span><span className="top-right"><Truck size={13}/> Free shipping over $99 <i /> <span>Talk to a real person: (800) 555-0148</span></span></div>
    <header className="site-header">
      <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setOpen(!open)}><Menu size={21}/></button>
      <Link href="/" className="brand" aria-label="Signal Supply home"><span className="brand-mark"><AudioLines size={22}/></span><span>SIGNAL<span className="brand-light">SUPPLY</span><small>INDEPENDENT AUDIO & ELECTRONICS</small></span></Link>
      <form className="search-box" onSubmit={submit}><Search size={18}/><input aria-label="Search products" placeholder="What are you looking for?" value={searchText} onChange={e => setSearchText(e.target.value)}/><button type="submit">Search</button></form>
      <nav className={`header-actions${open ? ' mobile-open' : ''}`}>
        <Link href="/account" className="header-link"><UserRound size={18}/><span>Account</span></Link>
        <Link href="/cart" className="header-link cart-link"><ShoppingBag size={19}/><span>Cart</span>{count > 0 && <b>{count}</b>}</Link>
      </nav>
    </header>
    <nav className="category-nav"><div className="nav-inner"><div className="nav-categories"><Link href="/" className="nav-item nav-shop">Shop all</Link>{categoryLinks.map(c => <Link key={c.slug} href={`/category/${c.slug}`} className="nav-item">{c.label}</Link>)}</div><Link href="/account" className="nav-help"><CircleHelp size={15}/> Need a hand?</Link></div></nav>
  </>;
}

function Footer() {
  return <footer className="footer"><div className="footer-main"><div><Link href="/" className="brand footer-brand"><span className="brand-mark"><AudioLines size={22}/></span><span>SIGNAL<span className="brand-light">SUPPLY</span><small>INDEPENDENT AUDIO & ELECTRONICS</small></span></Link><p>Thoughtful gear. Straight answers.<br/>A small shop for a better signal.</p></div><div className="footer-links"><div><b>Explore</b>{categoryLinks.slice(0, 4).map(c => <Link key={c.slug} href={`/category/${c.slug}`}>{c.label}</Link>)}</div><div><b>Here to help</b><Link href="/account">Order preview</Link><Link href="/cart">Your cart</Link><a href="mailto:hello@signalsupply.example">Contact the shop</a></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Signal Supply · Independent by design</span><Link href="/admin">Admin preview</Link><span>Stripe test checkout · Demo orders are not fulfilled</span></div></footer>;
}

function ProductCard({ product, add }: { product: Product; add: (id: string) => void }) {
  return <article className="product-card" data-testid={`card-product-${product.id}`}>
    <Link href={`/product/${product.id}`} className="product-art-link"><ProductArtwork product={product}/>{product.badge && <span className="product-badge">{product.badge}</span>}<span className="quick-view">Take a closer look <ArrowDownRight size={15}/></span></Link>
    <div className="product-copy"><div className="product-category">{product.category}</div><Link href={`/product/${product.id}`} className="product-name">{product.name}</Link><div className="rating"><span className="stars"><Star size={12} fill="currentColor"/></span><b>{product.rating.toFixed(1)}</b><span>({product.reviewCount})</span></div><div className="product-card-bottom"><div><strong>{money(product.price)}</strong>{product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}</div><button className="mini-add" onClick={() => add(product.id)} aria-label={`Add ${product.name} to cart`} data-testid={`button-add-${product.id}`}><Plus size={17}/></button></div></div>
  </article>;
}

function HomePage({ products, add, searchText }: { products: Product[]; add: (id: string) => void; searchText: string }) {
  const featured = products.filter(p => !searchText || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(searchText.toLowerCase()));
  return <main>
    <section className="hero wrap">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/>THE SIGNAL, NOT THE NOISE</div><h1>Good sound.<br/><em>Good sense.</em></h1><p>Audio and everyday tech, chosen by people who care how it works — and how it sounds.</p><div className="hero-buttons"><Link href="/category/headphones" className="button button-dark">Find your next favorite <ArrowRight size={16}/></Link><a href="#categories" className="text-link">Browse the shop <ArrowDownRight size={16}/></a></div><div className="hero-proof"><span><BadgeCheck size={15}/> People-first advice</span><span><ShieldCheck size={15}/> Carefully picked gear</span></div></div>
      <div className="hero-art"><div className="hero-art-note">LISTEN<br/>CLOSER</div><div className="hero-disc"><div className="disc-ring"/><div className="disc-center"><AudioLines size={50}/></div></div><div className="hero-tag">SS—001<br/><b>THE LISTENING ROOM</b></div><div className="hero-side-note">A little more signal in your day.</div></div>
      <div className="hero-counter"><span>01</span><i/> A SHOP FOR THE CURIOUS</div>
    </section>
    <section className="service-band"><div><Truck/><span><b>Free shipping over $99</b><small>Easy delivery, no surprises</small></span></div><div><ShieldCheck/><span><b>Picked with a point of view</b><small>Every item earns its shelf space</small></span></div><div><CircleHelp/><span><b>Helpful humans, always</b><small>Real answers before and after</small></span></div></section>
    <section id="categories" className="section wrap category-section"><div className="section-heading"><div><div className="eyebrow">FIND YOUR FREQUENCY</div><h2>Start with what<br className="desktop-break"/> you want to hear.</h2></div><span className="heading-note">A good system starts<br/>with one good choice.</span></div><div className="category-grid">{categoryLinks.map((c,i) => <Link href={`/category/${c.slug}`} className={`category-tile category-tile-${i}`} key={c.slug}><span className="category-number">0{i+1}</span><c.icon size={28} strokeWidth={1.4}/><strong>{c.label}</strong><span>{c.desc}</span><ArrowRight className="category-arrow" size={17}/></Link>)}</div></section>
    <section className="promo-band"><div className="promo-inner wrap"><div className="promo-mark"><Disc3 size={80} strokeWidth={0.85}/><span>LP<br/>SIDE A</span></div><div className="promo-copy"><div className="eyebrow">A BETTER WAY TO BEGIN</div><h2>Vinyl, without<br/>the guesswork.</h2><p>One thoughtfully matched turntable. A record collection worth revisiting. Let’s get the first spin right.</p><Link href="/product/orbit-turntable" className="button button-light">Meet the Orbit <ArrowRight size={16}/></Link></div><div className="promo-deal"><span>THIS WEEK</span><b>$70<br/>OFF</b><small>Orbit Manual Turntable</small><ArrowDownRight size={19}/></div></div></section>
    <section className="section wrap featured-section" id="featured"><div className="section-heading featured-heading"><div><div className="eyebrow">{searchText ? 'YOUR SEARCH' : 'THE SHORTLIST'}</div><h2>{searchText ? `Found for “${searchText}”` : 'Worth a closer listen.'}</h2></div><Link href="/category/headphones" className="text-link">Shop all gear <ArrowRight size={16}/></Link></div>{featured.length ? <div className="product-grid">{featured.map(p => <ProductCard key={p.id} product={p} add={add}/>)}</div> : <div className="empty-search"><Search size={25}/><h3>No exact match, yet.</h3><p>Try another term or browse the full shop.</p><button className="button button-dark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to search</button></div>}</section>
    <section className="advice-band"><div className="advice-left"><div className="eyebrow">BETTER QUESTIONS, BETTER SOUND</div><h2>Not sure what<br/>fits your setup?</h2><p>Tell us what you listen to, what you already own, and what you’re hoping for. We’ll help you make it make sense.</p><a href="mailto:hello@signalsupply.example" className="button button-dark">Ask the shop <ArrowRight size={16}/></a></div><div className="advice-right"><div className="quote-mark">“</div><blockquote>We think buying a piece of audio gear should feel like a conversation, not a scavenger hunt.</blockquote><div className="quote-credit"><span className="credit-rule"/> THE SIGNAL SUPPLY WAY</div><div className="advice-stamp"><AudioLines size={27}/><span>GOOD<br/>ADVICE</span></div></div></section>
    <section className="newsletter wrap"><div><div className="eyebrow">NOTES FROM THE LISTENING ROOM</div><h2>A little less noise<br/>in your inbox.</h2></div><form onSubmit={e => { e.preventDefault(); alert('Thanks for your interest. This demo does not collect email addresses.'); }}><label htmlFor="newsletter-email">Occasional new gear, listening notes, and helpful tips.</label><div className="newsletter-input"><input id="newsletter-email" type="email" placeholder="Your email address" required/><button aria-label="Sign up for notes"><ArrowRight size={18}/></button></div><small>No spam. No subscriptions. Just the good stuff.</small></form></section>
  </main>;
}

function CategoryPage({ products, add }: { products: Product[]; add: (id: string) => void }) {
  const params = useParams<{ slug: string }>();
  const category = categoryLinks.find(c => c.slug === params.slug);
  const matching = products.filter(p => p.category.toLowerCase().replaceAll('&', '').replaceAll(' ', '-') === params.slug || (params.slug === 'cables-power' && p.category === 'Cables & power') || (params.slug === 'hi-fi-components' && p.category === 'Hi-fi components'));
  const [sort, setSort] = useState('featured');
  const sorted = [...matching].sort((a,b) => sort === 'price-low' ? a.price-b.price : sort === 'price-high' ? b.price-a.price : b.rating-a.rating);
  return <main className="page-shell wrap"><div className="breadcrumbs"><Link href="/">Shop</Link><ChevronRight size={14}/><span>{category?.label || 'Category'}</span></div><div className="category-title-row"><div><div className="eyebrow">SHOP BY CATEGORY</div><h1>{category?.label || 'Shop'}</h1><p>{category?.desc}. Selected for everyday listening, built to last.</p></div><div className="category-title-icon">{category ? <category.icon size={43} strokeWidth={1.1}/> : <AudioLines size={43}/>}</div></div><div className="results-bar"><span>{matching.length} considered picks</span><label><SlidersHorizontal size={15}/><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort products"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={14}/></label></div>{sorted.length ? <div className="product-grid">{sorted.map(p => <ProductCard key={p.id} product={p} add={add}/>)}</div> : <div className="empty-search"><AudioLines size={28}/><h3>Nothing on this shelf just yet.</h3><p>Try another category or browse all the gear.</p><Link className="button button-dark" href="/">Back to the shop</Link></div>}</main>;
}

function ProductPage({ products, add }: { products: Product[]; add: (id: string) => void }) {
  const { id } = useParams<{ id: string }>();
  const product = products.find(p => p.id === id);
  const [added, setAdded] = useState(false);
  if (!product) return <main className="page-shell wrap"><div className="empty-search"><PackageCheck/><h2>We can’t find that piece.</h2><Link href="/" className="button button-dark">Return to the shop</Link></div></main>;
  return <main className="page-shell wrap"><div className="breadcrumbs"><Link href="/">Shop</Link><ChevronRight size={14}/><Link href={`/category/${categoryLinks.find(c => c.label === product.category)?.slug || ''}`}>{product.category}</Link><ChevronRight size={14}/><span>{product.name}</span></div><div className="detail-layout"><div className="detail-visual"><ProductArtwork product={product} large/><div className="visual-caption"><span>PRODUCT STUDY / {product.category.toUpperCase()}</span><span>SS—{product.id.slice(0,3).toUpperCase()}</span></div></div><div className="detail-info"><div className="eyebrow">SIGNAL SUPPLY SELECTION</div>{product.badge && <span className="detail-badge">{product.badge}</span>}<h1>{product.name}</h1><div className="rating detail-rating"><span className="stars"><Star size={13} fill="currentColor"/></span><b>{product.rating.toFixed(1)}</b><span>{product.reviewCount} shop reviews</span></div><div className="detail-price">{money(product.price)} {product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}</div><p className="detail-description">{product.description}</p><div className="stock-note"><span className="stock-dot"/>{product.stock > 0 ? `In stock · ${product.stock} ready to ship` : 'Currently out of stock'}</div><button className="button button-dark add-detail" onClick={() => { add(product.id); setAdded(true); }} disabled={product.stock < 1} data-testid="button-add-to-cart">{added ? <><Check size={17}/> Added to your bag</> : <><ShoppingBag size={17}/> Add to cart — {money(product.price)}</>}</button><div className="purchase-note"><ShieldCheck size={17}/><span>One-time purchase. No account required.<br/><small>Secure Stripe test checkout. No real payment is collected.</small></span></div><div className="detail-perks"><div><Truck size={18}/><span><b>Ships with care</b><small>Free over $99</small></span></div><div><CircleHelp size={18}/><span><b>Want a second opinion?</b><small>Talk to a real human</small></span></div></div><div className="detail-meta"><span>SKU <b>SS-{product.id.slice(0,5).toUpperCase()}</b></span><span>Category <b>{product.category}</b></span></div></div></div><section className="detail-after"><div className="eyebrow">WHY WE PICKED IT</div><h2>Good gear earns its place.</h2><p>We look for products that do their job beautifully, hold up to everyday use, and make sense for real listening spaces. This is one of them.</p></section></main>;
}

function CartPage({ products, cart, setCart }: { products: Product[]; cart: CartItem[]; setCart: (next: CartItem[]) => void }) {
  const items = cart.map(i => ({ ...i, product: products.find(p => p.id === i.productId) })).filter(i => i.product);
  const subtotal = items.reduce((s,i) => s + i.product!.price * i.quantity, 0);
  const shipping = subtotal >= 99 ? 0 : 8.95;
  return <main className="page-shell wrap">
    <div className="breadcrumbs"><Link href="/">Shop</Link><ChevronRight size={14}/><span>Your cart</span></div>
    <div className="page-heading"><div><div className="eyebrow">YOUR PICKS</div><h1>Your bag<span className="heading-count"> / {items.reduce((s,i) => s+i.quantity,0)}</span></h1></div></div>
    {items.length ? <div className="cart-layout">
      <div className="cart-items">{items.map(({product,quantity}) => {
        const maxQuantity = Math.min(product!.stock, 10);
        return <div className="cart-row" key={product!.id}>
          <Link href={`/product/${product!.id}`} className="cart-art"><ProductArtwork product={product!}/></Link>
          <div className="cart-item-copy"><div className="product-category">{product!.category}</div><Link className="product-name" href={`/product/${product!.id}`}>{product!.name}</Link><div className="cart-stock"><span className="stock-dot"/> In stock</div><button className="remove-button" onClick={() => setCart(cart.filter(c => c.productId !== product!.id))}>Remove</button></div>
          <div className="qty-control"><button aria-label="Decrease quantity" onClick={() => setCart(cart.map(c => c.productId === product!.id ? {...c, quantity: Math.max(1, c.quantity-1)} : c))} disabled={quantity <= 1}><Minus size={14}/></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setCart(cart.map(c => c.productId === product!.id ? {...c, quantity: Math.min(maxQuantity, c.quantity+1)} : c))} disabled={quantity >= maxQuantity}><Plus size={14}/></button></div>
          <strong className="cart-line-price">{money(product!.price * quantity)}</strong>
        </div>;
      })}</div>
      <aside className="cart-summary"><div className="eyebrow">ORDER SUMMARY</div><div className="summary-line"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="summary-line"><span>Standard shipping</span><b>{shipping ? money(shipping) : 'Free'}</b></div><div className="summary-total"><span>Estimated total</span><b>{money(subtotal + shipping)}</b></div><Link className="button button-dark checkout-link" href="/checkout">Continue to secure checkout <ArrowRight size={16}/></Link><p className="disabled-note">Test mode only. No real payment is collected. Card and eligible US bank-account details are entered securely on Stripe.</p><Link href="/" className="continue-shopping"><ArrowLeft size={15}/> Keep browsing</Link></aside>
    </div> : <div className="empty-cart"><div className="empty-cart-icon"><ShoppingBag size={34}/></div><div className="eyebrow">NOTHING IN THE BAG</div><h2>Your next favorite<br/>is out there.</h2><p>Take a look around. We’ll keep your picks right here.</p><Link className="button button-dark" href="/">Explore the shop <ArrowRight size={16}/></Link></div>}
  </main>;
}

function CheckoutPage({ products, cart }: { products: Product[]; cart: CartItem[] }) {
  const items = cart.map(i => ({ ...i, product: products.find(p => p.id === i.productId) })).filter(i => i.product);
  const subtotal = items.reduce((sum, item) => sum + item.product!.price * item.quantity, 0);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length || loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, items: items.map(item => ({ productId: item.productId, quantity: item.quantity })) }),
      });
      const result: unknown = await response.json();
      if (!response.ok || typeof result !== 'object' || result === null || !('url' in result) || typeof result.url !== 'string') {
        const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Checkout could not be started. Please try again.';
        throw new Error(message);
      }
      window.location.assign(result.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Checkout could not be started. Please try again.');
      setLoading(false);
    }
  };

  return <main className="page-shell wrap">
    <div className="breadcrumbs"><Link href="/cart">Your cart</Link><ChevronRight size={14}/><span>Secure checkout</span></div>
    <div className="page-heading"><div><div className="eyebrow">A SAFE, TEST-MODE CHECKOUT</div><h1>One last detail.</h1><p>You’ll complete payment on Stripe’s secure checkout page.</p></div></div>
    {items.length ? <div className="checkout-layout">
      <form className="checkout-form" onSubmit={startCheckout}>
        <label htmlFor="checkout-email">Email for your receipt</label>
        <input id="checkout-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required/>
        <div className="payment-options">
          <div><ShieldCheck size={19}/><span><b>Credit & debit cards</b><small>Card methods depend on the Stripe account configuration.</small></span></div>
          <div><Check size={19}/><span><b>US bank account (ACH)</b><small>ACH Direct Debit is available to eligible US Stripe accounts; bank verification stays on Stripe.</small></span></div>
        </div>
        <div className="preview-alert"><ShieldCheck size={17}/><span><b>Demo checkout is in test mode.</b> Use Stripe test payment details. No real charge will be made; bank-account methods appear only when enabled for the Stripe test account.</span></div>
        {error && <p className="checkout-error" role="alert">{error}</p>}
        <button className="button button-dark checkout-submit" type="submit" disabled={loading}>{loading ? 'Connecting to Stripe…' : <>Continue to Stripe <ArrowRight size={16}/></>}</button>
        <Link href="/cart" className="continue-shopping"><ArrowLeft size={15}/> Return to cart</Link>
      </form>
      <aside className="cart-summary">
        <div className="eyebrow">ORDER SUMMARY</div>
        {items.map(item => <div className="summary-line" key={item.product!.id}><span>{item.product!.name} × {item.quantity}</span><b>{money(item.product!.price * item.quantity)}</b></div>)}
        <div className="summary-line"><span>Shipping</span><b>{subtotal >= 99 ? 'Free' : money(8.95)}</b></div>
        <div className="summary-total"><span>Estimated total</span><b>{money(subtotal + (subtotal >= 99 ? 0 : 8.95))}</b></div>
        <p className="disabled-note">Demo taxes are not configured. Stripe collects the shipping address and displays the payment methods enabled for this account.</p>
      </aside>
    </div> : <div className="empty-cart"><div className="eyebrow">YOUR BAG IS EMPTY</div><h2>Add something to your bag first.</h2><Link className="button button-dark" href="/">Return to the shop</Link></div>}
  </main>;
}

function CheckoutSuccessPage() {
  return <main className="page-shell wrap"><div className="empty-cart"><div className="empty-cart-icon"><Check size={34}/></div><div className="eyebrow">STRIPE TEST CHECKOUT</div><h1>Thanks for trying it.</h1><p>This storefront is a test demo. No real payment is collected, and orders are not saved or fulfilled.</p><Link className="button button-dark" href="/">Back to Signal Supply <ArrowRight size={16}/></Link></div></main>;
}

function AccountPage() {
  return <main className="page-shell wrap"><div className="preview-alert"><ShieldCheck size={17}/><span><b>Account preview</b> — sample information only. This storefront has no login, account security, or live order data.</span></div><div className="page-heading"><div><div className="eyebrow">YOUR SIGNAL SUPPLY</div><h1>Account <span className="heading-count">/ preview</span></h1><p>What an account area could look like. Nothing here is tied to a real customer.</p></div><div className="account-avatar">ME</div></div><div className="account-overview"><div><div className="eyebrow">DEMO CUSTOMER</div><h2>Morgan Ellis</h2><p>morgan@example.net</p></div><div className="account-note"><CircleHelp size={19}/><span>Need help with an order?<br/><a href="mailto:hello@signalsupply.example">Talk to the shop</a></span></div></div><div className="order-section-title"><div><div className="eyebrow">A LITTLE HISTORY</div><h2>Sample orders</h2></div><span>2 example orders</span></div><div className="orders-list">{sampleOrders.map(order => <article key={order.id} className="order-card"><div className="order-top"><div><span className="order-id">{order.id}</span><span className="order-date">{order.createdAt}</span></div><span className={`order-status ${order.status === 'Delivered' ? 'delivered' : ''}`}><span className="status-dot"/>{order.status}</span></div><div className="order-products">{order.items.map(it => { const p = starterProducts.find(product => product.id === it.productId)!; return <div key={p.id}><span>{p.name}</span><small>Qty {it.quantity}</small></div>; })}</div><div className="order-bottom"><span>{order.items.reduce((s,i) => s+i.quantity,0)} item{order.items.length > 1 ? 's' : ''}</span><b>{money(order.total)}</b></div></article>)}</div></main>;
}

function AdminPage({ products, setProducts }: { products: Product[]; setProducts: (p: Product[]) => void }) {
  const [draftName, setDraftName] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const [draftCategory, setDraftCategory] = useState('Headphones');
  const [tab, setTab] = useState<'catalog'|'orders'>('catalog');
  const create = (e: FormEvent) => { e.preventDefault(); const name = draftName.trim(); const price = Number(draftPrice); if (!name || !price || price < 1) return; setProducts([{ id: `demo-${Date.now()}`, name, category: draftCategory, description: 'A new demo catalog item. Add thoughtful details when you are ready.', price, image: 'dac', rating: 0, reviewCount: 0, stock: 1, paymentType: 'one-time', badge: 'New item' }, ...products]); setDraftName(''); setDraftPrice(''); };
  return <main className="admin-page"><div className="admin-top"><div className="wrap admin-top-inner"><Link href="/" className="admin-brand"><span className="admin-brand-icon"><AudioLines size={19}/></span><span>SIGNAL SUPPLY<small>BACK ROOM / DEMO</small></span></Link><Link href="/" className="admin-exit"><ArrowLeft size={15}/> Return to storefront</Link></div></div><div className="admin-wrap"><div className="preview-alert admin-warning"><ShieldCheck size={17}/><span><b>Admin preview only.</b> No login, security, API, or live catalog is configured. Edits are stored in this browser only.</span></div><div className="admin-heading"><div><div className="eyebrow">CONTROL ROOM / 001</div><h1>Shop desk.</h1><p>A small working catalog and sample order view.</p></div><span className="admin-live"><span/> LOCAL DEMO</span></div><div className="admin-stats"><div><span>CATALOG ITEMS</span><b>{products.length}</b><small>in this browser</small></div><div><span>DEMO ORDERS</span><b>{sampleOrders.length}</b><small>sample records</small></div><div><span>STORAGE</span><b>LOCAL</b><small>not published</small></div></div><div className="admin-tabs"><button className={tab==='catalog'?'active':''} onClick={() => setTab('catalog')}>Catalog <span>{products.length}</span></button><button className={tab==='orders'?'active':''} onClick={() => setTab('orders')}>Sample orders <span>{sampleOrders.length}</span></button></div>{tab === 'catalog' ? <div className="admin-content"><section className="admin-add-panel"><div className="eyebrow">ADD A DEMO ITEM</div><h2>Give the shelf something new.</h2><form className="admin-form" onSubmit={create}><label>Product name<input value={draftName} onChange={e=>setDraftName(e.target.value)} placeholder="e.g. Weekend Listening Amp" required/></label><div className="admin-form-row"><label>Price<input type="number" min="1" step="1" value={draftPrice} onChange={e=>setDraftPrice(e.target.value)} placeholder="149" required/></label><label>Category<select value={draftCategory} onChange={e=>setDraftCategory(e.target.value)}>{categoryLinks.map(c=><option key={c.label}>{c.label}</option>)}</select></label></div><button className="button button-dark"><Plus size={16}/> Add to demo catalog</button></form></section><section className="admin-catalog"><div className="admin-list-heading"><div><div className="eyebrow">ON THE SHELF</div><h2>Catalog</h2></div><button className="reset-button" onClick={()=>setProducts(starterProducts)}>Reset to original demo catalog</button></div>{products.length ? products.map(p=><div className="admin-product-row" key={p.id}><ProductArtwork product={p}/><div className="admin-product-info"><b>{p.name}</b><span>{p.category} · {p.stock} in stock</span></div><strong>{money(p.price)}</strong><button className="delete-item" aria-label={`Remove ${p.name}`} onClick={()=>setProducts(products.filter(x=>x.id!==p.id))}><X size={17}/></button></div>) : <div className="admin-empty">The catalog is empty. Add an item above or restore the demo set.</div>}</section></div> : <div className="admin-orders">{sampleOrders.map(order=><div className="admin-order-row" key={order.id}><div><b>{order.id}</b><span>{order.customerName} · {order.customerEmail}</span></div><span>{order.createdAt}</span><span className="order-status"><span className="status-dot"/>{order.status}</span><strong>{money(order.total)}</strong></div>)}</div>}<p className="admin-footnote">Changes are saved in local browser storage only. Clearing site data restores the original catalog.</p></div></main>;
}

function Storefront() {
  const [products, setProducts] = useState<Product[]>(() => readStorage('signal-supply-products-v2', starterProducts));
  const [cart, setCart] = useState<CartItem[]>(() => readStorage('signal-supply-cart', []));
  const [searchText, setSearchText] = useState('');
  useEffect(() => localStorage.setItem('signal-supply-products-v2', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('signal-supply-cart', JSON.stringify(cart)), [cart]);
  const add = (id: string) => setCart(prev => { const product = products.find(item => item.id === id); if (!product || product.stock < 1) return prev; const existing = prev.find(item => item.productId === id); if (existing && existing.quantity >= Math.min(product.stock, 10)) return prev; return existing ? prev.map(item => item.productId === id ? {...item, quantity: item.quantity+1} : item) : [...prev, {productId:id, quantity:1}]; });
  const count = cart.reduce((s,i)=>s+i.quantity,0);
  return <><Header count={count} searchText={searchText} setSearchText={setSearchText}/><Switch><Route path="/" component={()=><HomePage products={products} add={add} searchText={searchText}/>} /><Route path="/category/:slug" component={()=><CategoryPage products={products} add={add}/>} /><Route path="/product/:id" component={()=><ProductPage products={products} add={add}/>} /><Route path="/cart" component={()=><CartPage products={products} cart={cart} setCart={setCart}/>} /><Route path="/checkout" component={()=><CheckoutPage products={products} cart={cart}/>} /><Route path="/checkout/success" component={CheckoutSuccessPage}/><Route path="/account" component={AccountPage}/><Route path="/admin" component={()=><AdminPage products={products} setProducts={setProducts}/>} /><Route component={NotFound}/></Switch><Footer/></>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Storefront/></RoutedErrorBoundary></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}

export default App;
