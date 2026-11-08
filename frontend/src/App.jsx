import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700";
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("home");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        if (category && category !== "All") params.append("category", category);
        const queryStr = params.toString() ? `?${params.toString()}` : "";
        const response = await fetch(`${API}/products${queryStr}`, { signal: controller.signal });
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

  function addToCart(product) {
    setCart((old) => {
      const found = old.find((x) => x._id === product._id);
      return found
        ? old.map((x) => (x._id === product._id ? { ...x, quantity: x.quantity + 1 } : x))
        : [...old, { ...product, quantity: 1 }];
    });
    setMessage(`${product.name} added to cart.`);
    setError("");
  }

  function changeQuantity(id, change) {
    setCart((old) =>
      old
        .map((x) => (x._id === id ? { ...x, quantity: x.quantity + change } : x))
        .filter((x) => x.quantity > 0)
    );
  }

  function removeProduct(id) {
    setCart((old) => old.filter((x) => x._id !== id));
  }

  function navigateToProducts() {
    setPage("home");
    setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  const count = useMemo(() => cart.reduce((s, x) => s + x.quantity, 0), [cart]);
  const total = useMemo(() => cart.reduce((s, x) => s + x.price * x.quantity, 0), [cart]);

  async function checkout(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please fill in both name and email.");
      return;
    }
    if (cart.length === 0) {
      setError("Your cart is empty. Add items before checking out.");
      return;
    }
    try {
      setPlacing(true);
      setError("");
      setMessage("");
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          email: email.trim(),
          items: cart.map((x) => ({ productId: x._id, quantity: x.quantity }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Order failed");
      setMessage(`Demo order placed! Order ID: ${data.orderId}. Total: ${money(data.totalAmount)}.`);
      setCart([]);
      setName("");
      setEmail("");
      setPage("home");
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <button className="logo" onClick={() => setPage("home")}>
          ShopSmart<span>.</span>
        </button>
        <nav>
          <button onClick={() => setPage("home")}>Home</button>
          <button onClick={navigateToProducts}>Products</button>
        </nav>
        <button
          className="cart-button"
          onClick={() => {
            setPage("cart");
            setMessage("");
          }}
        >
          Cart ({count})
        </button>
      </header>

      <main>
        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}

        {page === "home" && (
          <>
            <section className="hero">
              <div>
                <p className="tagline">SMART SHOPPING, EASY LIVING</p>
                <h1>Find everything you need.</h1>
                <p>Explore useful products, discover great choices, and shop with ease.</p>
                <button className="primary-button" onClick={navigateToProducts}>
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
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>All</option>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home</option>
                </select>
              </div>
              {loading ? (
                <p>Loading products...</p>
              ) : products.length === 0 ? (
                <p>No products found. Try another search.</p>
              ) : (
                <div className="product-grid">
                  {products.map((p) => (
                    <article className="product-card" key={p._id}>
                      <img
                        src={p.image}
                        alt={p.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="product-info">
                        <span className="category">{p.category}</span>
                        <h3>{p.name}</h3>
                        <p>{p.description}</p>
                        <p className="rating">Rating: {p.rating} / 5</p>
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

        {page === "cart" && (
          <section className="cart-page">
            <div className="cart-page-heading">
              <div>
                <p className="tagline">YOUR SHOPPING</p>
                <h1>My Shopping Cart</h1>
              </div>
              <button className="secondary-button" onClick={() => setPage("home")}>
                Continue Shopping
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <h2>Your Cart is Empty!</h2>
                <p>Add products to see their photos and details here.</p>
                <button className="primary-button" onClick={navigateToProducts}>
                  Explore Products
                </button>
              </div>
            ) : (
              <>
                <div className="cart-products">
                  {cart.map((x) => (
                    <article className="cart-item" key={x._id}>
                      <img
                        className="cart-product-image"
                        src={x.image}
                        alt={x.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="cart-product-details">
                        <span className="category">{x.category}</span>
                        <h3>{x.name}</h3>
                        <p>{money(x.price)} each</p>
                        <strong>Subtotal: {money(x.price * x.quantity)}</strong>
                      </div>
                      <div className="quantity">
                        <button onClick={() => changeQuantity(x._id, -1)}>-</button>
                        <span>{x.quantity}</span>
                        <button onClick={() => changeQuantity(x._id, 1)}>+</button>
                        <button className="remove-button" onClick={() => removeProduct(x._id)}>
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <aside className="cart-summary">
                  <h2>Order Summary</h2>
                  <p>
                    Total products: <strong>{count}</strong>
                  </p>
                  <h2>Total: {money(total)}</h2>
                </aside>
                <form className="checkout-form" onSubmit={checkout}>
                  <h3>Demo Checkout</h3>
                  <input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={80}
                  />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button disabled={placing}>{placing ? "Placing order..." : "Place Demo Order"}</button>
                  <p className="small-note">Demo only. No payment will be collected.</p>
                </form>
              </>
            )}
          </section>
        )}
      </main>

      <footer>
        <h2>ShopSmart.</h2>
        <p>Smart choices. Easy shopping.</p>
        <p>Student project · Demo orders only</p>
      </footer>
    </div>
  );
}
