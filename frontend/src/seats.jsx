import { useEffect, useState } from "react";
import { api, errorText, when } from "./api.js";
import { useAuth } from "./auth.jsx";
import { useNotice } from "./notice.jsx";

export function SeatForm({ name = "" }) {
  const { toast } = useNotice();
  const [form, setForm] = useState({ name, partySize: "2", requestedFor: "" });
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/seat-requests", {
        method: "POST",
        body: {
          name: form.name.trim(),
          partySize: Number(form.partySize),
          requestedFor: form.requestedFor,
        },
      });
      setForm({ name, partySize: "2", requestedFor: "" });
      toast("wait", "Table request sent.");
    } catch (err) {
      toast("bad", errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sheet" onSubmit={submit}>
      <h2>Ask for a table</h2>
      <label>
        Name
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </label>
      <label>
        Party size
        <input type="number" min="1" max="20" value={form.partySize} onChange={(event) => setForm({ ...form, partySize: event.target.value })} required />
      </label>
      <label>
        Time
        <input type="datetime-local" value={form.requestedFor} onChange={(event) => setForm({ ...form, requestedFor: event.target.value })} required />
      </label>
      <button className="primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Request a table"}</button>
    </form>
  );
}

export function SeatList() {
  const { token } = useAuth();
  const { toast, confirm } = useNotice();
  const [rows, setRows] = useState([]);

  async function load() {
    setRows(await api("/api/seat-requests", { token }));
  }

  useEffect(() => {
    load().catch((err) => toast("bad", errorText(err)));
  }, [token]);

  async function reserve(row) {
    try {
      const saved = await api(`/api/seat-requests/${row.id}/reserve`, { method: "PATCH", token });
      toast("wait", saved.tableNumber ? `Table ${saved.tableNumber} reserved for ${saved.name}.` : `${saved.name} is reserved.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  async function drop(row) {
    const yes = await confirm(`Do you really want to drop the reservation for ${row.name}?`);
    if (!yes) return;
    try {
      await api(`/api/seat-requests/${row.id}/drop`, { method: "PATCH", token });
      toast("bad", `Reservation for ${row.name} dropped.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  if (!rows.length) return null;

  return (
    <section className="stack">
      <h2>Table requests</h2>
      <ul className="plain">
        {rows.map((row) => (
          <li key={row.id}>
            <span>{row.name} · party of {row.partySize} · {when(row.requestedFor)} · {row.status.toLowerCase()}{row.tableNumber ? ` · table ${row.tableNumber}` : ""}</span>
            <span className="actions">
              {row.status === "REQUESTED" && <button type="button" onClick={() => reserve(row)}>Mark reserved</button>}
              <button type="button" className="ghost" onClick={() => drop(row)}>Drop</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
