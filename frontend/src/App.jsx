import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
const money = n => `₹${Number(n).toLocaleString("en-IN")}`;

function Stars({ rating }) {
  return (
    <span className="stars" title={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? "star filled" : "star"}>★</span>
      ))}
      <span className="star-label">{rating}/5</span>
    </span>
  );
}

function WishlistButton({ product, wishlist, onToggle }) {
  const inList = wishlist.some(w => w._id === product._id);
  return (
    <button
      type="button"
      className={`wishlist-btn${inList ? " wishlisted" : ""}`}
      title={inList ? "Remove from wishlist" : "Add to wishlist"}
      onClick={e => { e.stopPropagation(); onToggle(product); }}
      aria-label={inList ? "Remove from wishlist" : "Add to wishlist"}
    >
      {inList ? "♥" : "♡"}
    </button>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("shopsmart_cart") || "[]"); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("shopsmart_wishlist") || "[]"); } catch { return []; }
  });
  const [page, setPage] = useState("home");
  const [name, setName] = useState(() => localStorage.getItem("shopsmart_name") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("shopsmart_email") || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Order history state
  const [orders, setOrders] = useState([]);
  const [orderEmail, setOrderEmail] = useState(() => localStorage.getItem("shopsmart_email") || "");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [lastOrderEmail, setLastOrderEmail] = useState(() => localStorage.getItem("shopsmart_email") || "");

  // Persist cart & wishlist
  useEffect(() => { localStorage.setItem("shopsmart_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("shopsmart_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ search, category });
        const response = await fetch(`${API}/products?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Could not load products. Check the backend.");
        setProducts(await response.json());
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [search, category]);

  const sortedProducts = useMemo(() => {
    const copy = [...products];
    if (sortBy === "price-asc") copy.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") copy.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating-desc") copy.sort((a, b) => b.rating - a.rating);
    return copy;
  }, [products, sortBy]);

  function addToCart(product) {
    setCart(old => {
      const found = old.find(x => x._id === product._id);
      return found
        ? old.map(x => x._id === product._id ? { ...x, quantity: x.quantity + 1 } : x)
        : [...old, { ...product, quantity: 1 }];
    });
    setMessage(`${product.name} added to cart.`);
    setError("");
  }

  function changeQuantity(id, change) {
    setCart(old =>
      old.map(x => (x._id === id ? { ...x, quantity: x.quantity + change } : x)).filter(x => x.quantity > 0)
    );
  }

  function removeProduct(id) {
    setCart(old => old.filter(x => x._id !== id));
  }

  function toggleWishlist(product) {
    setWishlist(old =>
      old.some(w => w._id === product._id)
        ? old.filter(w => w._id !== product._id)
        : [...old, product]
    );
  }

  const count = useMemo(() => cart.reduce((s, x) => s + x.quantity, 0), [cart]);
  const total = useMemo(() => cart.reduce((s, x) => s + x.price * x.quantity, 0), [cart]);

  async function checkout(event) {
    event.preventDefault();
    try {
      setPlacing(true);
      setError("");
      setMessage("");
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          email,
          items: cart.map(x => ({ productId: x._id, quantity: x.quantity }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Order failed");

      const placedEmail = email.trim().toLowerCase();
      setLastOrderEmail(placedEmail);
      setOrderEmail(placedEmail);
      localStorage.setItem("shopsmart_name", name.trim());
      localStorage.setItem("shopsmart_email", placedEmail);

      setMessage(`🎉 Order placed! Order ID: ${data.orderId}. Total: ${money(data.totalAmount)}.`);
      setCart([]);
      setPage("home");

      // Auto-load history for the placed email
      await loadOrders(placedEmail);
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  async function loadOrders(emailToLoad) {
    const q = (emailToLoad || orderEmail).trim().toLowerCase();
    if (!q) {
      setOrdersError("Please enter your email to view orders.");
      return;
    }
    try {
      setOrdersLoading(true);
      setOrdersError("");
      setOrders([]);
      const response = await fetch(`${API}/orders?email=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load orders");
      setOrders(data);
      localStorage.setItem("shopsmart_email", q);
    } catch (e) {
      setOrdersError(e.message);
    } finally {
      setOrdersLoading(false);
    }
  }

  function goToOrderHistory() {
    setPage("orders");
    setMessage("");
    setError("");
    const targetEmail = lastOrderEmail || orderEmail;
    if (targetEmail) {
      setOrderEmail(targetEmail);
      loadOrders(targetEmail);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <button className="logo" onClick={() => setPage("home")}>ShopSmart<span>.</span></button>
        <nav>
          <button className={page === "home" ? "nav-active" : ""} onClick={() => { setPage("home"); setMessage(""); }}>Home</button>
          <button className={page === "wishlist" ? "nav-active" : ""} onClick={() => { setPage("wishlist"); setMessage(""); }}>
            Wishlist {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </button>
          <button className={page === "orders" ? "nav-active" : ""} onClick={goToOrderHistory}>My Orders</button>
        </nav>
        <button className="cart-button" onClick={() => { setPage("cart"); setMessage(""); }}>
          🛒 Cart ({count})
        </button>
      </header>

      <main>
        {message && (
          <div className="notice success">
            <span>{message}</span>
            {lastOrderEmail && page !== "orders" && (
              <button className="link-btn" onClick={goToOrderHistory}>View Orders →</button>
            )}
          </div>
        )}
        {error && <div className="notice error">{error}</div>}

        {/* ── HOME / PRODUCTS ── */}
        {page === "home" && (
          <>
            <section className="hero">
              <div>
                <p className="tagline">SMART SHOPPING, EASY LIVING</p>
                <h1>Find everything you need.</h1>
                <p>Explore useful products, discover great choices, and shop with ease.</p>
                <button className="primary-button" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>
                  Explore Products
                </button>
              </div>
            </section>

            <section className="products-section" id="products">
              <p className="tagline">OUR COLLECTION</p>
              <h2>Explore Products</h2>
              <div className="filters">
                <input
                  type="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option>All</option>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="default">Sort: Default</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="rating-desc">Top Rated</option>
                </select>
              </div>
              {loading ? (
                <p className="loading-msg">Loading products…</p>
              ) : sortedProducts.length === 0 ? (
                <p>No products found. Try another search.</p>
              ) : (
                <div className="product-grid">
                  {sortedProducts.map(p => (
                    <article className="product-card" key={p._id}>
                      <div className="card-img-wrap">
                        <img src={p.image} alt={p.name} />
                        <WishlistButton product={p} wishlist={wishlist} onToggle={toggleWishlist} />
                      </div>
                      <div className="product-info">
                        <span className="category">{p.category}</span>
                        <h3>{p.name}</h3>
                        <p>{p.description}</p>
                        <Stars rating={p.rating} />
                        <div className="product-bottom">
                          <strong>{money(p.price)}</strong>
                          <button onClick={() => addToCart(p)}>Add to Cart</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── WISHLIST ── */}
        {page === "wishlist" && (
          <section className="cart-page">
            <div className="cart-page-heading">
              <div><p className="tagline">YOUR SAVED ITEMS</p><h1>My Wishlist</h1></div>
              <button className="secondary-button" onClick={() => setPage("home")}>Continue Shopping</button>
            </div>
            {wishlist.length === 0 ? (
              <div className="empty-cart">
                <h2>Your Wishlist is Empty!</h2>
                <p>Heart ♡ any product to save it here.</p>
                <button className="primary-button" onClick={() => setPage("home")}>Explore Products</button>
              </div>
            ) : (
              <div className="product-grid">
                {wishlist.map(p => (
                  <article className="product-card" key={p._id}>
                    <div className="card-img-wrap">
                      <img src={p.image} alt={p.name} />
                      <WishlistButton product={p} wishlist={wishlist} onToggle={toggleWishlist} />
                    </div>
                    <div className="product-info">
                      <span className="category">{p.category}</span>
                      <h3>{p.name}</h3>
                      <p>{p.description}</p>
                      <Stars rating={p.rating} />
                      <div className="product-bottom">
                        <strong>{money(p.price)}</strong>
                        <button onClick={() => addToCart(p)}>Add to Cart</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── CART ── */}
        {page === "cart" && (
          <section className="cart-page">
            <div className="cart-page-heading">
              <div><p className="tagline">YOUR SHOPPING</p><h1>My Shopping Cart</h1></div>
              <button className="secondary-button" onClick={() => setPage("home")}>Continue Shopping</button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <h2>Your Cart is Empty!</h2>
                <p>Add products to see them here.</p>
                <button className="primary-button" onClick={() => setPage("home")}>Explore Products</button>
              </div>
            ) : (
              <>
                <div className="cart-products">
                  {cart.map(x => (
                    <article className="cart-item" key={x._id}>
                      <img className="cart-product-image" src={x.image} alt={x.name} />
                      <div className="cart-product-details">
                        <span className="category">{x.category}</span>
                        <h3>{x.name}</h3>
                        <p>{money(x.price)} each</p>
                        <Stars rating={x.rating} />
                        <strong>Subtotal: {money(x.price * x.quantity)}</strong>
                      </div>
                      <div className="quantity">
                        <button onClick={() => changeQuantity(x._id, -1)}>−</button>
                        <span>{x.quantity}</span>
                        <button onClick={() => changeQuantity(x._id, 1)}>+</button>
                        <button className="remove-button" onClick={() => removeProduct(x._id)}>Remove</button>
                      </div>
                    </article>
                  ))}
                </div>

                <aside className="cart-summary">
                  <h2>Order Summary</h2>
                  <p>Total items: <strong>{count}</strong></p>
                  {cart.map(x => (
                    <p key={x._id}>
                      <span>{x.name} ×{x.quantity}</span>
                      <span>{money(x.price * x.quantity)}</span>
                    </p>
                  ))}
                  <div className="summary-total">
                    <span>Total</span>
                    <strong>{money(total)}</strong>
                  </div>
                </aside>

                <form className="checkout-form" onSubmit={checkout}>
                  <h3>Demo Checkout</h3>
                  <input
                    placeholder="Enter your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    maxLength={80}
                  />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <button disabled={placing}>{placing ? "Placing order…" : "Place Demo Order"}</button>
                  <p className="small-note">Demo only. No payment will be collected.</p>
                </form>
              </>
            )}
          </section>
        )}

        {/* ── ORDER HISTORY ── */}
        {page === "orders" && (
          <section className="cart-page">
            <div className="cart-page-heading">
              <div><p className="tagline">YOUR PURCHASE HISTORY</p><h1>My Orders</h1></div>
              <button className="secondary-button" onClick={() => setPage("home")}>Back to Shopping</button>
            </div>
            <form className="order-lookup" onSubmit={e => { e.preventDefault(); loadOrders(); }}>
              <input
                type="email"
                placeholder="Enter your email to view orders"
                value={orderEmail}
                onChange={e => setOrderEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={ordersLoading}>{ordersLoading ? "Loading…" : "View Orders"}</button>
            </form>
            {ordersError && <div className="notice error">{ordersError}</div>}
            {!ordersLoading && orders.length === 0 && orderEmail && !ordersError && (
              <div className="empty-cart">
                <h2>No orders found</h2>
                <p>No orders placed with <strong>{orderEmail}</strong>.</p>
              </div>
            )}
            {orders.length > 0 && (
              <div className="orders-list">
                {orders.map(order => (
                  <div className="order-card" key={order._id}>
                    <div className="order-header">
                      <div>
                        <p className="order-id">Order ID: <code>{order._id}</code></p>
                        <p className="order-date">
                          {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                        <p className="order-customer">👤 {order.customerName}</p>
                      </div>
                      <div className="order-total">
                        <span className="order-status">✅ Confirmed</span>
                        <strong>{money(order.totalAmount)}</strong>
                      </div>
                    </div>
                    <div className="order-items">
                      {order.items.map((item, i) => (
                        <div className="order-item" key={item._id || item.productId || i}>
                          <img src={item.image} alt={item.name} />
                          <div>
                            <p className="order-item-name">{item.name}</p>
                            <p className="order-item-meta">
                              {money(item.price)} × {item.quantity} = <strong>{money(item.price * item.quantity)}</strong>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer>
        <h2>ShopSmart.</h2>
        <p>Smart choices. Easy shopping.</p>
        <div className="footer-links">
          <button className="footer-link" onClick={() => setPage("home")}>Products</button>
          <button className="footer-link" onClick={() => setPage("wishlist")}>Wishlist</button>
          <button className="footer-link" onClick={goToOrderHistory}>My Orders</button>
        </div>
        <p className="footer-note">Student project · Demo orders only</p>
      </footer>
    </div>
  );
}
