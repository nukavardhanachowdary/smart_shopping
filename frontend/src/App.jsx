import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
const money = n => `₹${Number(n).toLocaleString("en-IN")}`;

const FALLBACK_PRODUCTS = [
  { _id: "p1", name: "Wireless Headphones", description: "Comfortable headphones with clear sound.", category: "Electronics", price: 1499, rating: 4.5, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700" },
  { _id: "p2", name: "Smart Watch", description: "A simple everyday smart watch.", category: "Electronics", price: 2499, rating: 4.4, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700" },
  { _id: "p3", name: "Casual Backpack", description: "A useful backpack for college and travel.", category: "Fashion", price: 999, rating: 4.3, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700" },
  { _id: "p4", name: "Running Shoes", description: "Lightweight shoes for everyday use.", category: "Fashion", price: 1899, rating: 4.6, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700" },
  { _id: "p5", name: "Desk Lamp", description: "A modern lamp for your study table.", category: "Home", price: 799, rating: 4.2, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700" },
  { _id: "p6", name: "Coffee Mug", description: "A reusable ceramic mug.", category: "Home", price: 299, rating: 4.1, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700" }
];

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
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
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
  const [loading, setLoading] = useState(false);
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

  // Load products with automatic fallback
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ search, category });
        const response = await fetch(`${API}/products?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Backend response error");
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          // Local filter if backend returns empty search
          filterLocal(search, category);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          // Graceful fallback to built-in product collection (e.g. on GitHub Pages)
          filterLocal(search, category);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    function filterLocal(s, cat) {
      let filtered = FALLBACK_PRODUCTS;
      if (cat && cat !== "All") {
        filtered = filtered.filter(p => p.category.toLowerCase() === cat.toLowerCase());
      }
      if (s && s.trim()) {
        const query = s.trim().toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
      }
      setProducts(filtered);
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
        ? old.map(x => (x._id === product._id ? { ...x, quantity: x.quantity + 1 } : x))
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
    const placedEmail = email.trim().toLowerCase();
    const placedName = name.trim();
    const orderItems = cart.map(x => ({
      productId: x._id,
      name: x.name,
      image: x.image,
      price: x.price,
      quantity: x.quantity
    }));

    try {
      setPlacing(true);
      setError("");
      setMessage("");

      let orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
      let totalAmount = total;

      try {
        const response = await fetch(`${API}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: placedName,
            email: placedEmail,
            items: cart.map(x => ({ productId: x._id, quantity: x.quantity }))
          })
        });
        if (response.ok) {
          const data = await response.json();
          orderId = data.orderId || orderId;
          totalAmount = data.totalAmount || totalAmount;
        }
      } catch {
        // Backend offline / GitHub Pages demo mode: proceed with local order
      }

      // Always save order to local storage history
      const newOrder = {
        _id: orderId,
        customerName: placedName,
        email: placedEmail,
        items: orderItems,
        totalAmount,
        createdAt: new Date().toISOString()
      };

      try {
        const savedOrders = JSON.parse(localStorage.getItem("shopsmart_orders") || "[]");
        savedOrders.unshift(newOrder);
        localStorage.setItem("shopsmart_orders", JSON.stringify(savedOrders));
      } catch {
        // ignore storage errors
      }

      setLastOrderEmail(placedEmail);
      setOrderEmail(placedEmail);
      localStorage.setItem("shopsmart_name", placedName);
      localStorage.setItem("shopsmart_email", placedEmail);

      setMessage(`🎉 Order placed! Order ID: ${orderId}. Total: ${money(totalAmount)}.`);
      setCart([]);
      setPage("home");

      await loadOrders(placedEmail);
    } catch (e) {
      setError(e.message || "Could not place order");
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

      let loaded = [];
      try {
        const response = await fetch(`${API}/orders?email=${encodeURIComponent(q)}`);
        if (response.ok) {
          loaded = await response.json();
        }
      } catch {
        // backend offline
      }

      // Merge with localStorage orders
      try {
        const localSaved = JSON.parse(localStorage.getItem("shopsmart_orders") || "[]");
        const matchingLocal = localSaved.filter(o => o.email === q);
        const seenIds = new Set(loaded.map(x => x._id));
        for (const loc of matchingLocal) {
          if (!seenIds.has(loc._id)) {
            loaded.push(loc);
          }
        }
      } catch {
        // ignore
      }

      loaded.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(loaded);
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
