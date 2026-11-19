import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api, errorText, money } from "../api.js";
import { Banner, Empty } from "../ui.jsx";
import { Footer } from "../site.jsx";
import { useNotice } from "../notice.jsx";
import { SeatForm } from "../seats.jsx";
import { PastOrders } from "./Orders.jsx";

const CartContext = createContext(null);
const CART_KEY = "hearth_cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const value = useMemo(() => {
    const count = cart.reduce((sum, line) => sum + line.quantity, 0);
    const total = cart.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0);
    return {
      cart,
      count,
      total,
      add(item) {
        setCart((current) => {
          const existing = current.find((line) => line.menuItemId === item.id);
          if (existing) {
            return current.map((line) => line.menuItemId === item.id ? { ...line, quantity: line.quantity + 1 } : line);
          }
          return [...current, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
      },
      setQty(menuItemId, quantity) {
        setCart((current) => current.flatMap((line) => {
          if (line.menuItemId !== menuItemId) return [line];
          if (quantity < 1) return [];
          return [{ ...line, quantity }];
        }));
      },
      clear() {
        setCart([]);
      },
    };
  }, [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("Cart is missing");
  return cart;
}

export function CustomerFrame({ children }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand" end>Hearth</NavLink>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="who">
          <span>{user?.username}</span>
          <em>Customer</em>
          <button type="button" className="ghost" onClick={logout}>Log out</button>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
      {count > 0 && (
        <button type="button" className="cart-dock" onClick={() => navigate("/checkout")}>
          Cart · {count}
        </button>
      )}
    </div>
  );
}

export function CustomerHome() {
  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">Your table</p>
          <h1>Good to see you.</h1>
        </div>
      </header>
      <div className="tiles">
        <Link className="tile" to="/menu"><i>M</i><span>Menu</span></Link>
        <Link className="tile" to="/checkout"><i>C</i><span>Cart</span></Link>
        <Link className="tile" to="/orders"><i>O</i><span>Orders</span></Link>
        <Link className="tile" to="/settings"><i>S</i><span>Settings</span></Link>
        <Link className="tile" to="/table"><i>T</i><span>A table</span></Link>
      </div>
    </div>
  );
}

export function TableAsk() {
  const { user } = useAuth();
  return (
    <div className="stack narrow">
      <header className="page-head">
        <div>
          <p className="kicker">A table</p>
          <h1>Ask the house to hold one.</h1>
        </div>
      </header>
      <SeatForm name={user?.username || ""} />
    </div>
  );
}

export function CustomerMenu() {
  const { token } = useAuth();
  const cart = useCart();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api("/api/menu/categories", { token }),
      api("/api/menu/items", { token }),
    ]).then(([nextCategories, nextItems]) => {
      setCategories(nextCategories);
      setItems(nextItems);
    }).catch((err) => setError(errorText(err)));
  }, [token]);

  const visible = items.filter((item) => filter === "all" || String(item.categoryId) === filter);

  return (
    <div className="food">
      <header className="page-head">
        <div>
          <p className="kicker">Order</p>
          <h1>What would you like?</h1>
          <p className="lede">Type and price are on every card. Add what you want, then check out.</p>
        </div>
      </header>
      <Banner>{error}</Banner>
      <div className="filters">
        <button type="button" className={filter === "all" ? "primary" : "ghost"} onClick={() => setFilter("all")}>All</button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={filter === String(category.id) ? "primary" : "ghost"}
            onClick={() => setFilter(String(category.id))}
          >
            {category.name}
          </button>
        ))}
      </div>
      {visible.length === 0 && <Empty>Nothing in this part of the menu.</Empty>}
      <div className="dish-grid">
        {visible.map((item) => (
          <article className={`dish-card ${item.available ? "" : "unavailable"}`} key={item.id}>
            <p className="kicker">{item.categoryName}</p>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="line">
              <strong className="price">{money(item.price)}</strong>
              {item.available ? (
                <span className="qty">
                  <button type="button" onClick={() => cart.setQty(item.id, (cart.cart.find((line) => line.menuItemId === item.id)?.quantity || 0) - 1)} disabled={!cart.cart.some((line) => line.menuItemId === item.id)}>−</button>
                  <span>{cart.cart.find((line) => line.menuItemId === item.id)?.quantity || 0}</span>
                  <button type="button" onClick={() => cart.add(item)}>+</button>
                </span>
              ) : <span className="muted">Unavailable</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Checkout() {
  const { token } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const { toast } = useNotice();
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/tables", { token })
      .then((rows) => {
        setTables(rows);
        const open = rows.find((table) => table.status === "AVAILABLE") || rows[0];
        if (open) setTableId(String(open.id));
      })
      .catch((err) => toast("bad", errorText(err)));
  }, [token]);

  async function placeOrder() {
    if (!cart.cart.length) {
      toast("bad", "Add at least one dish.");
      return;
    }
    if (!tableId) {
      toast("bad", "Choose a table first.");
      return;
    }
    if (!cardName.trim() || !cardNumber.trim()) {
      toast("bad", "Enter the card name and number.");
      return;
    }
    setBusy(true);
    try {
      const order = await api("/api/orders", {
        method: "POST",
        token,
        body: {
          tableId: Number(tableId),
          items: cart.cart.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
        },
      });
      cart.clear();
      toast("ok", `Paid. Order for table ${order.tableNumber} is in.`);
      navigate("/orders");
    } catch (err) {
      toast("bad", errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack narrow">
      <header className="page-head">
        <div>
          <p className="kicker">Checkout</p>
          <h1>Send this order</h1>
          <p className="lede">Choose a table, then pay. The card is only a stand-in. Nothing leaves this house.</p>
        </div>
      </header>
      <section className="sheet">
        {cart.cart.length === 0 && <Empty>Your cart is empty. <Link to="/menu">Back to the menu</Link></Empty>}
        {cart.cart.map((line) => (
          <div className="line" key={line.menuItemId}>
            <span>{line.name}</span>
            <span className="qty">
              <button type="button" onClick={() => cart.setQty(line.menuItemId, line.quantity - 1)}>-</button>
              {line.quantity}
              <button type="button" onClick={() => cart.setQty(line.menuItemId, line.quantity + 1)}>+</button>
            </span>
            <strong>{money(Number(line.price) * line.quantity)}</strong>
          </div>
        ))}
        {cart.cart.length > 0 && (
          <>
            <label>
              Table
              <select value={tableId} onChange={(event) => setTableId(event.target.value)}>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Table {table.tableNumber} · seats {table.capacity} · {table.status.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <div className="line">
              <strong>Total</strong>
              <strong>{money(cart.total)}</strong>
            </div>
            <label>
              Name on card
              <input value={cardName} onChange={(event) => setCardName(event.target.value)} autoComplete="cc-name" />
            </label>
            <label>
              Card number
              <input value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} inputMode="numeric" autoComplete="off" placeholder="A fake number is fine" />
            </label>
            <button className="primary" type="button" disabled={busy} onClick={placeOrder}>
              {busy ? "Paying…" : "Pay"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export function Settings() {
  const { user, updateProfile } = useAuth();
  const { toast } = useNotice();
  const [form, setForm] = useState({
    name: user?.username || "",
    email: user?.email || "",
    password: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: user?.username || "",
      email: user?.email || "",
    }));
  }, [user]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await updateProfile(form.name.trim(), form.email.trim(), form.password);
      setForm((current) => ({ ...current, password: "" }));
      toast("ok", "Profile saved.");
    } catch (err) {
      toast("bad", errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">Settings</p>
          <h1>Your account</h1>
          <p className="lede">Name, email, password, and the orders you have already sent.</p>
        </div>
      </header>
      <form className="sheet" onSubmit={save}>
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={3} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label className="span-2">
          New password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            minLength={form.password ? 8 : undefined}
            placeholder="Leave blank to keep the current password"
            autoComplete="new-password"
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
      </form>
      <section className="stack">
        <h2>Past orders</h2>
        <PastOrders />
      </section>
    </div>
  );
}
