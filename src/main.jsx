import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, addDoc, collection, query, orderBy, updateDoc } from 'firebase/firestore'
import { Lock, LogOut, MessageCircle, Phone, Save, ShieldCheck, ShoppingBag, Share2 } from 'lucide-react'
import { auth, db, firebaseReady } from './firebase'
import { defaultContent } from './defaultContent'
import { banglaDigits, formatTk, scrollToOrder } from './utils'
import './styles.css'

function useContent() {
  const [content, setContent] = useState(defaultContent)
  const [source, setSource] = useState('default')

  useEffect(() => {
    if (!db) return
    const ref = doc(db, 'siteContent', 'landing')
    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        setContent({ ...defaultContent, ...snap.data() })
        setSource('firestore')
      } else {
        setSource('default')
      }
    }, () => setSource('default'))
  }, [])

  return { content, source }
}

function Countdown({ hours = 12 }) {
  const [left, setLeft] = useState(hours * 60 * 60)
  useEffect(() => {
    const id = setInterval(() => setLeft(value => (value <= 0 ? hours * 60 * 60 : value - 1)), 1000)
    return () => clearInterval(id)
  }, [hours])
  const h = String(Math.floor(left / 3600)).padStart(2, '0')
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0')
  const s = String(left % 60).padStart(2, '0')
  return <span className="timer"><b>{h}</b><b>{m}</b><b>{s}</b></span>
}

function TopBars({ content }) {
  return <>
    <div className="offer-bar"><span>✧</span> {content.promo.top} <Countdown hours={content.promo.expiresInHours} /></div>
    <div className="ticker"><div>{content.promo.ticker}</div></div>
  </>
}

function Hero({ content }) {
  return <header className="hero">
    <div className="container hero-inner">
      <div className="badge">{content.hero.badge}</div>
      <h1>{content.hero.title}</h1>
      <p className="subtitle">{content.hero.subtitle}</p>
      <div className="rating"><span>{'★'.repeat(5)}</span> {content.hero.rating}</div>
      <div className="gallery">
        {content.hero.images.map((src, idx) => <img key={src + idx} src={src} alt={`product-${idx}`} />)}
      </div>
      <div className="hero-copy">
        <p className="warning">{content.hero.warning}</p>
        <h2>{content.hero.offerTitle}</h2>
        <p>{content.hero.offerText}</p>
      </div>
    </div>
  </header>
}

function Benefits({ content }) {
  return <section className="section cream">
    <div className="container two-col">
      <div>
        <p className="eyebrow">✨ কেন ব্যবহার করবেন?</p>
        <ul className="benefits">{content.benefits.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="trust-grid">{content.trustBadges.map(item => <div key={item}><ShieldCheck />{item}</div>)}</div>
    </div>
  </section>
}

function Stats({ content }) {
  return <section className="section stats">
    <div className="container center">
      <h2>{content.stats.heading}</h2>
      <p>{content.stats.text}</p>
      <div className="stat-number">{content.stats.count}</div>
      <strong>{content.stats.label}</strong>
      <p className="call">যে কোনো প্রয়োজনে কল করুন <a href={`tel:${content.contact.phone}`}>{content.contact.phoneBangla}</a></p>
    </div>
  </section>
}

function OrderForm({ content }) {
  const [selectedId, setSelectedId] = useState(content.products[0]?.id)
  const [shippingArea, setShippingArea] = useState('insideDhaka')
  const [quantity, setQuantity] = useState(1)
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [status, setStatus] = useState('')

  useEffect(() => setSelectedId(content.products[0]?.id), [content.products])
  const selected = content.products.find(product => product.id === selectedId) || content.products[0]
  const shipment = Number(content.shipping[shippingArea] || 0)
  const subtotal = Number(selected?.price || 0) * Number(quantity || 1)
  const total = subtotal + shipment

  async function submitOrder(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setStatus('নাম, মোবাইল নাম্বার এবং ঠিকানা লিখুন।')
      return
    }
    if (!db) {
      setStatus('Firebase config এখনো বসানো হয়নি। .env ফাইল সেট করার পর অর্ডার Firestore-এ যাবে।')
      return
    }
    await addDoc(collection(db, 'orders'), {
      customer: { name: form.name, phone: form.phone, address: form.address },
      notes: form.notes,
      product: { id: selected.id, name: selected.name, price: selected.price, quantity: Number(quantity) },
      shipping: { area: shippingArea, label: shippingArea === 'insideDhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাহিরে' },
      subtotal,
      shipment,
      total,
      status: 'new',
      createdAt: serverTimestamp()
    })
    setStatus('অর্ডার সফল হয়েছে। খুব দ্রুত কল করে কনফার্ম করা হবে।')
    setForm({ name: '', phone: '', address: '', notes: '' })
  }

  return <section id="order" className="section order-section">
    <div className="container">
      <h2 className="center">যেকোনো একটি সিলেক্ট করুন</h2>
      <div className="product-grid">{content.products.map(product => <button className={`product-card ${selectedId === product.id ? 'active' : ''}`} key={product.id} onClick={() => setSelectedId(product.id)}>
        <img src={product.image} alt={product.name} />
        <span className="tag">{product.tag}</span>
        <h3>{product.name}</h3>
        <p>{product.savings}</p>
        <strong>{formatTk(product.price)}</strong> <del>{formatTk(product.oldPrice)}</del>
      </button>)}</div>

      <div className="checkout">
        <form onSubmit={submitOrder} className="billing">
          <h3>📝 Billing details</h3>
          <label>আপনার নাম<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" /></label>
          <label>মোবাইল নাম্বার *<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" /></label>
          <label>আপনার সম্পূর্ন ঠিকানা লিখুন *<textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="বাসা/রোড/এলাকা/জেলা" /></label>
          <label>নোট (ঐচ্ছিক)<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ডেলিভারি নির্দেশনা" /></label>
          <h4>Shipping</h4>
          <label className="radio"><input type="radio" checked={shippingArea === 'insideDhaka'} onChange={() => setShippingArea('insideDhaka')} /> ঢাকার ভিতরে: <b>{formatTk(content.shipping.insideDhaka)}</b></label>
          <label className="radio"><input type="radio" checked={shippingArea === 'outsideDhaka'} onChange={() => setShippingArea('outsideDhaka')} /> ঢাকার বাহিরে: <b>{formatTk(content.shipping.outsideDhaka)}</b></label>
          <button className="primary" type="submit">অর্ডার প্লেস করুন — {formatTk(total)}</button>
          {status && <p className="form-status">{status}</p>}
          <small>আপনার পার্সোনাল ডাটা সম্পূর্ণ গোপনীয় থাকবে।</small>
        </form>
        <aside className="order-summary">
          <h3>Your order</h3>
          <div className="summary-product"><img src={selected?.image} alt="" /><div><b>{selected?.name}</b><p>× {banglaDigits(quantity)}</p></div></div>
          <label>Quantity<input type="number" min="1" max="20" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
          <label>প্যাকেজ পরিবর্তন<select value={selectedId} onChange={e => setSelectedId(e.target.value)}>{content.products.map(product => <option key={product.id} value={product.id}>{product.name} — ৳{product.price}</option>)}</select></label>
          <div className="row"><span>Subtotal</span><b>{formatTk(subtotal)}</b></div>
          <div className="row"><span>Shipment</span><b>{formatTk(shipment)}</b></div>
          <div className="row total"><span>Total</span><b>{formatTk(total)}</b></div>
          <p className="cod">💵 <b>Cash on delivery</b> — পণ্যটি হাতে নিয়ে চেক করে পেমেন্ট করুন।</p>
        </aside>
      </div>
    </div>
  </section>
}

function Testimonials({ content }) {
  return <section className="section cream">
    <div className="container">
      <h2 className="center">⭐ গ্রাহকদের মতামত</h2>
      <p className="center muted">4.8/5 (২৮৪৭)</p>
      <div className="cards">{content.testimonials.map(item => <article key={item.name}><div className="stars">★★★★★</div><p>{item.text}</p><b>{item.name}</b> <small>যাচাইকৃত ক্রয়</small></article>)}</div>
    </div>
  </section>
}

function FAQ({ content }) {
  return <section className="section">
    <div className="container narrow">
      <h2 className="center">❓ সাধারণ প্রশ্নোত্তর</h2>
      {content.faqs.map((item, index) => <details key={item.q} open={index === 0}><summary>{item.q}</summary><p>{item.a}</p></details>)}
    </div>
  </section>
}

function FinalCta({ content }) {
  const starterPrice = content.products[0]?.price || 490
  return <>
    <section className="final-cta">
      <div className="container center">
        <p className="eyebrow">{content.finalCta.eyebrow}</p>
        <h2>{content.finalCta.title}</h2>
        <p>{content.finalCta.text}</p>
        <button className="primary large" onClick={scrollToOrder}>{content.finalCta.button}</button>
        <p>{content.finalCta.note}</p>
        <div className="cta-links"><a href={`tel:${content.contact.phone}`}><Phone /> কল</a><a href={content.contact.whatsapp}><MessageCircle /> WhatsApp</a><a href={content.contact.facebook}><Share2 /> Facebook</a></div>
      </div>
    </section>
    <div className="sticky-cta"><a href={`tel:${content.contact.phone}`}>কল</a><button onClick={scrollToOrder}>অর্ডার {formatTk(starterPrice + Number(content.shipping.insideDhaka || 0))}</button><a href={content.contact.whatsapp}>WhatsApp</a></div>
  </>
}

function Footer({ content }) {
  return <footer><div className="container center"><p>{content.footer.text}</p><p>যে কোনো প্রয়োজনে কল করুন: <a href={`tel:${content.contact.phone}`}>{content.contact.phoneBangla}</a></p><p><a href={content.contact.facebook}>Facebook</a> • <a href={content.contact.whatsapp}>WhatsApp</a></p><small>{content.footer.copyright}</small></div></footer>
}

function Landing() {
  const { content, source } = useContent()
  return <>
    {!firebaseReady && <div className="config-warning">Firebase env বসানো নেই — সাইট দেখা যাবে, কিন্তু অর্ডার/অ্যাডমিন চালু হবে না।</div>}
    <TopBars content={content} />
    <Hero content={content} />
    <Benefits content={content} />
    <Stats content={content} />
    <OrderForm content={content} />
    <Testimonials content={content} />
    <FAQ content={content} />
    <FinalCta content={content} />
    <Footer content={content} />
  </>
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!auth) return setError('Firebase env missing. .env সেট করুন।')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      onLogin?.()
    } catch (err) {
      setError(err.message)
    }
  }
  return <div className="admin-login"><form onSubmit={submit}><Lock size={34} /><h1>Admin Login</h1><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><button className="primary">Login</button>{error && <p className="error">{error}</p>}<a href="/">← Back to website</a></form></div>
}

function AdminDashboard({ user }) {
  const [tab, setTab] = useState('content')
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [json, setJson] = useState(JSON.stringify(defaultContent, null, 2))
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!db || !user) return
    getDoc(doc(db, 'admins', user.uid)).then(snap => {
      setIsAdmin(snap.exists())
      setChecking(false)
    })
  }, [user])

  useEffect(() => {
    if (!db || !isAdmin) return
    const ref = doc(db, 'siteContent', 'landing')
    const unsubContent = onSnapshot(ref, snap => setJson(JSON.stringify(snap.exists() ? { ...defaultContent, ...snap.data() } : defaultContent, null, 2)))
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsubOrders = onSnapshot(q, snap => setOrders(snap.docs.map(item => ({ id: item.id, ...item.data() }))))
    return () => { unsubContent(); unsubOrders() }
  }, [isAdmin])

  async function saveContent() {
    setMessage('')
    try {
      const parsed = JSON.parse(json)
      await setDoc(doc(db, 'siteContent', 'landing'), parsed, { merge: true })
      setMessage('Landing page content saved.')
    } catch (err) {
      setMessage(`Save failed: ${err.message}`)
    }
  }

  async function setOrderStatus(id, status) {
    await updateDoc(doc(db, 'orders', id), { status })
  }

  if (checking) return <div className="admin-shell"><p>Checking admin access...</p></div>
  if (!isAdmin) return <div className="admin-shell"><h1>Access denied</h1><p>Your UID is <code>{user.uid}</code>. Add a document at <code>admins/{user.uid}</code> in Firestore, then reload.</p><button onClick={() => signOut(auth)}>Logout</button></div>

  return <div className="admin-shell">
    <aside className="admin-sidebar"><h2>Magic Admin</h2><button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}><Save /> Landing Editor</button><button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><ShoppingBag /> Orders</button><button onClick={() => signOut(auth)}><LogOut /> Logout</button><a href="/">View site</a></aside>
    <main className="admin-main">
      {tab === 'content' && <section><h1>Landing page editor</h1><p>Edit any text, product, price, image, shipping charge, FAQ, testimonial, contact link, or CTA below. Valid JSON is saved to Firestore.</p><textarea className="json-editor" value={json} onChange={e => setJson(e.target.value)} /><button className="primary" onClick={saveContent}>Save to Firestore</button>{message && <p className="form-status">{message}</p>}</section>}
      {tab === 'orders' && <section><h1>Orders</h1><div className="orders">{orders.map(order => <article key={order.id}><div><h3>{order.customer?.name}</h3><p>{order.customer?.phone}</p><p>{order.customer?.address}</p><p>{order.product?.name} × {order.product?.quantity} — <b>{formatTk(order.total)}</b></p><small>{order.notes}</small></div><select value={order.status} onChange={e => setOrderStatus(order.id, e.target.value)}><option value="new">new</option><option value="confirmed">confirmed</option><option value="shipped">shipped</option><option value="delivered">delivered</option><option value="cancelled">cancelled</option></select></article>)}{orders.length === 0 && <p>No orders yet.</p>}</div></section>}
    </main>
  </div>
}

function AdminApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!auth) { setLoading(false); return }
    return onAuthStateChanged(auth, current => { setUser(current); setLoading(false) })
  }, [])
  if (loading) return <div className="admin-login">Loading...</div>
  if (!user) return <AdminLogin />
  return <AdminDashboard user={user} />
}

function App() {
  return window.location.pathname.startsWith('/admin') ? <AdminApp /> : <Landing />
}

createRoot(document.getElementById('root')).render(<App />)
