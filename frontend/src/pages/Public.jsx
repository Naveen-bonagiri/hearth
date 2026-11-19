import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorText, money } from "../api.js";
import { Empty } from "../ui.jsx";
import { SeatForm } from "../seats.jsx";

const HOURS = "Tuesday to Sunday, 12:00–3:00 and 6:30–10:30. Monday the fire is out.";
const PLACE = "18 Rest House Road, Bengaluru";

export function PublicHome() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/menu/items")
      .then((rows) => setItems(rows.filter((item) => item.available).slice(0, 4)))
      .catch((err) => setError(errorText(err)));
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <p className="kicker">A small dining room</p>
        <h1>Come in. The fire is already going.</h1>
        <p className="lede">A warm table and a quiet evening, the kind you start missing on the way home.</p>
        <div className="actions">
          <Link className="button primary" to="/menu">See the menu</Link>
          <Link className="button ghost" to="/register">Sign up</Link>
          <Link className="button ghost" to="/login">Log in</Link>
        </div>
      </section>

      <section className="visit-strip">
        <div className="visit-card">
          <p className="kicker">Where</p>
          <h2>{PLACE}</h2>
        </div>
        <div className="visit-card">
          <p className="kicker">Hours</p>
          <p>{HOURS}</p>
        </div>
      </section>

      <section className="story">
        <p className="kicker">The room</p>
        <h2>One grill, a short list, and the same prices on the ticket.</h2>
        <p>Hearth started as a small room with one fire and a handful of dishes. We still cook that way. What you read on the menu is what the kitchen sends, and a later price change does not rewrite a ticket you already placed.</p>
      </section>

      <section className="stack">
        <div className="page-head">
          <div>
            <p className="kicker">From the card</p>
            <h2>A few dishes</h2>
          </div>
          <Link to="/menu">Full menu</Link>
        </div>
        {error && <p className="muted">{error}</p>}
        {items.length === 0 && !error && <Empty>The menu is being set.</Empty>}
        <div className="dish-grid">
          {items.map((item) => (
            <article className="dish-card" key={item.id}>
              <p className="kicker">{item.categoryName}</p>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <strong className="price">{money(item.price)}</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PublicMenu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/api/menu/categories"), api("/api/menu/items")])
      .then(([nextCategories, nextItems]) => {
        setCategories(nextCategories);
        setItems(nextItems);
      })
      .catch((err) => setError(errorText(err)));
  }, []);

  const grouped = useMemo(() => categories.map((category) => ({
    ...category,
    items: items.filter((item) => item.categoryId === category.id),
  })), [categories, items]);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">The card</p>
          <h1>Menu</h1>
          <p className="lede">Browse freely. Sign up as a customer when you want to send an order.</p>
        </div>
        <Link className="button primary" to="/login">Log in to order</Link>
      </header>
      {error && <p className="muted">{error}</p>}
      {grouped.length === 0 && !error && <Empty>The menu is being set.</Empty>}
      {grouped.map((category) => (
        <section key={category.id} className="stack">
          <div>
            <h2>{category.name}</h2>
            <p className="muted">{category.description}</p>
          </div>
          <div className="dish-grid">
            {category.items.map((item) => (
              <article className={`dish-card ${item.available ? "" : "unavailable"}`} key={item.id}>
                <p className="kicker">{category.name}</p>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <strong className="price">{money(item.price)}</strong>
                {!item.available && <p className="muted">Unavailable tonight</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function About() {
  return (
    <div className="stack narrow">
      <header className="page-head">
        <div>
          <p className="kicker">About</p>
          <h1>A humble room with a fire in the middle.</h1>
        </div>
      </header>
      <section className="card stack">
        <p>Hearth is a small dining room in Bengaluru. The menu stays short so the kitchen can cook it properly. A customer reads the card, chooses a table, and sends the ticket.</p>
        <p>Staff watch the pass and the tables. A manager keeps the menu, the staff accounts, and the day’s numbers. An admin keeps the book of people and what each role may do.</p>
        <p>We would rather be known for a warm plate than for a long speech. Come hungry.</p>
      </section>
    </div>
  );
}

export function Faq() {
  const items = [
    ["Do I need an account to read the menu?", "No. The menu is open. An account is for sending an order and seeing it later."],
    ["What does sign up create?", "A customer account. Staff and manager accounts are opened by someone who already works here."],
    ["Can I change an order?", "Yes, while it is still pending. After the kitchen starts it, ask the floor."],
    ["Where are my old orders?", "After you log in, they live under Settings, with your name, email, and password."],
    ["When are you open?", HOURS],
  ];
  return (
    <div className="stack narrow">
      <header className="page-head">
        <div>
          <p className="kicker">FAQ</p>
          <h1>A few honest answers.</h1>
        </div>
      </header>
      {items.map(([question, answer]) => (
        <article className="card stack" key={question}>
          <h2>{question}</h2>
          <p>{answer}</p>
        </article>
      ))}
    </div>
  );
}

export function Visit() {
  return (
    <div className="stack narrow">
      <header className="page-head">
        <div>
          <p className="kicker">Visit</p>
          <h1>Come to the room.</h1>
          <p className="lede">Leave a name, a party size, and a time. The floor will hold a table, or you can walk in.</p>
        </div>
      </header>
      <SeatForm />
      <section className="card stack">
        <h2>Address</h2>
        <p>{PLACE}</p>
        <p className="muted">Bengaluru, India</p>
      </section>
      <section className="card stack">
        <h2>Hours</h2>
        <p>{HOURS}</p>
      </section>
      <section className="card stack">
        <h2>Contact</h2>
        <p>Ask at the door, or write to hello@hearth.example.</p>
        <p className="muted">That address is for this demo only.</p>
      </section>
    </div>
  );
}
