import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errorText, money } from "../api.js";
import { Empty } from "../ui.jsx";
import { useNotice } from "../notice.jsx";

const emptyItem = { categoryId: "", name: "", description: "", price: "", available: true };

export default function Menu() {
  const { token, can } = useAuth();
  const { toast, confirm } = useNotice();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(emptyItem);
  const [editing, setEditing] = useState(null);
  const [categoryDraft, setCategoryDraft] = useState({ name: "", description: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const [nextCategories, nextItems] = await Promise.all([
      api("/api/menu/categories", { token }),
      api("/api/menu/items", { token }),
    ]);
    setCategories(nextCategories);
    setItems(nextItems);
    setDraft((current) => ({ ...current, categoryId: current.categoryId || nextCategories[0]?.id || "" }));
  }

  useEffect(() => {
    load().catch((err) => toast("bad", errorText(err)));
  }, [token]);

  const grouped = useMemo(() => categories.map((category) => ({
    ...category,
    items: items.filter((item) => item.categoryId === category.id),
  })), [categories, items]);

  async function saveItem(event) {
    event.preventDefault();
    const previous = editing?.id ? items.find((item) => item.id === editing.id) : null;
    const body = {
      categoryId: Number(editing ? editing.categoryId : draft.categoryId),
      name: (editing ? editing.name : draft.name).trim(),
      description: editing ? editing.description : draft.description,
      price: Number(editing ? editing.price : draft.price),
      available: editing ? editing.available : draft.available,
    };
    const markingOff = body.available === false && (previous ? previous.available : true);
    if (markingOff) {
      const yes = await confirm(`Do you really want to mark ${body.name} unavailable?`);
      if (!yes) return;
    }
    setBusy(true);
    try {
      if (editing?.id) {
        await api(`/api/menu/items/${editing.id}`, { method: "PUT", token, body });
        setEditing(null);
      } else {
        await api("/api/menu/items", { method: "POST", token, body });
        setDraft({ ...emptyItem, categoryId: categories[0]?.id || "" });
      }
      toast(markingOff ? "bad" : "ok", markingOff ? `${body.name} is unavailable.` : `${body.name} saved.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    try {
      await api("/api/menu/categories", { method: "POST", token, body: categoryDraft });
      setCategoryDraft({ name: "", description: "" });
      toast("ok", "Category saved.");
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="kicker">The card</p>
          <h1>Edit the menu</h1>
          <p className="lede">Change a dish, a price, or whether it is available tonight. A ticket already sent keeps its old price.</p>
        </div>
      </header>
      <div>
        <div>
          {grouped.length === 0 && <Empty>The menu is empty. Add a category, then a dish.</Empty>}
          {grouped.map((category) => (
            <section className="category" key={category.id}>
              <h2>{category.name}</h2>
              <p className="muted">{category.description}</p>
              {category.items.length === 0 && <p className="muted">No dishes in this category yet.</p>}
              {category.items.map((item) => (
                <article className={`dish ${item.available ? "" : "unavailable"}`} key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                    {!item.available && <p>Unavailable tonight</p>}
                  </div>
                  <div className="stack" style={{ justifyItems: "end" }}>
                    <span className="price">{money(item.price)}</span>
                    {can("MENU_MANAGE") && (
                      <button type="button" className="ghost" onClick={() => setEditing({ ...item })}>Edit</button>
                    )}
                  </div>
                </article>
              ))}
            </section>
          ))}
          {can("MENU_MANAGE") && (
            <section className="sheet stack">
              <h2>{editing?.id ? `Edit ${editing.name}` : "Add a dish"}</h2>
              <form onSubmit={saveItem} className="form-grid">
                <label>
                  Category
                  <select
                    value={editing ? editing.categoryId : draft.categoryId}
                    onChange={(event) => {
                      const categoryId = event.target.value;
                      if (editing) setEditing({ ...editing, categoryId });
                      else setDraft({ ...draft, categoryId });
                    }}
                    required
                  >
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label>
                  Price
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editing ? editing.price : draft.price}
                    onChange={(event) => {
                      const price = event.target.value;
                      if (editing) setEditing({ ...editing, price });
                      else setDraft({ ...draft, price });
                    }}
                    required
                  />
                </label>
                <label className="span-2">
                  Name
                  <input
                    value={editing ? editing.name : draft.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      if (editing) setEditing({ ...editing, name });
                      else setDraft({ ...draft, name });
                    }}
                    required
                  />
                </label>
                <label className="span-2">
                  Description
                  <textarea
                    value={editing ? (editing.description || "") : draft.description}
                    onChange={(event) => {
                      const description = event.target.value;
                      if (editing) setEditing({ ...editing, description });
                      else setDraft({ ...draft, description });
                    }}
                  />
                </label>
                <label className="checks">
                  <input
                    type="checkbox"
                    checked={editing ? !!editing.available : draft.available}
                    onChange={(event) => {
                      const available = event.target.checked;
                      if (editing) setEditing({ ...editing, available });
                      else setDraft({ ...draft, available });
                    }}
                  />
                  Available tonight
                </label>
                <div className="actions">
                  <button className="primary" type="submit" disabled={busy}>{editing?.id ? "Save dish" : "Add dish"}</button>
                  {editing?.id && <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel edit</button>}
                </div>
              </form>
              <form onSubmit={saveCategory} className="form-grid">
                <label>
                  New category
                  <input value={categoryDraft.name} onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} required />
                </label>
                <label>
                  Description
                  <input value={categoryDraft.description} onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })} />
                </label>
                <button type="submit">Add category</button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
