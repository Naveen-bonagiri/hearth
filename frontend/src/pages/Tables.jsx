import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errorText } from "../api.js";
import { TableBoard } from "../floor.jsx";
import { useNotice } from "../notice.jsx";
import { SeatList } from "../seats.jsx";

const blank = { tableNumber: "", capacity: 2, status: "AVAILABLE" };

export default function Tables() {
  const { token, can } = useAuth();
  const { toast, confirm } = useNotice();
  const [tables, setTables] = useState([]);
  const [draft, setDraft] = useState(blank);
  const [editing, setEditing] = useState(null);

  async function load() {
    setTables(await api("/api/tables", { token }));
  }

  useEffect(() => {
    load().catch((err) => toast("bad", errorText(err)));
  }, [token]);

  async function onStatus(table, status) {
    if (table.status === "RESERVED" && status === "AVAILABLE") {
      const yes = await confirm("Do you really want to drop this reservation?");
      if (!yes) return;
    }
    try {
      await api(`/api/tables/${table.id}/status`, { method: "PATCH", token, body: { status } });
      const dropped = table.status === "RESERVED" && status === "AVAILABLE";
      toast(dropped ? "bad" : status === "RESERVED" ? "wait" : "ok", dropped ? `Reservation on table ${table.tableNumber} dropped.` : `Table ${table.tableNumber} marked ${status.toLowerCase()}.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  async function save(event) {
    event.preventDefault();
    const source = editing || draft;
    const body = {
      tableNumber: source.tableNumber.trim(),
      capacity: Number(source.capacity),
      status: source.status,
    };
    try {
      if (editing) {
        await api(`/api/tables/${editing.id}`, { method: "PUT", token, body });
        toast("ok", `Table ${body.tableNumber} saved.`);
        setEditing(null);
      } else {
        await api("/api/tables", { method: "POST", token, body });
        toast("ok", `Table ${body.tableNumber} added.`);
        setDraft(blank);
      }
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  async function remove(table) {
    const yes = await confirm(`Do you really want to remove table ${table.tableNumber}?`);
    if (!yes) return;
    try {
      await api(`/api/tables/${table.id}`, { method: "DELETE", token });
      toast("bad", `Table ${table.tableNumber} removed.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">The floor</p>
          <h1>Tables</h1>
          <p className="lede">Seat a party, hold a reservation, or free a table when the ticket is done.</p>
        </div>
      </header>
      <TableBoard tables={tables} onStatus={onStatus} canUpdate={can("TABLE_VIEW")} />
      <SeatList />
      {can("TABLE_MANAGE") && (
        <section className="sheet stack">
          <h2>{editing ? `Edit table ${editing.tableNumber}` : "Add a table"}</h2>
          <form onSubmit={save} className="form-grid">
            <label>
              Number
              <input
                value={editing ? editing.tableNumber : draft.tableNumber}
                onChange={(event) => {
                  const tableNumber = event.target.value;
                  if (editing) setEditing({ ...editing, tableNumber });
                  else setDraft({ ...draft, tableNumber });
                }}
                required
              />
            </label>
            <label>
              Seats
              <input
                type="number"
                min="1"
                value={editing ? editing.capacity : draft.capacity}
                onChange={(event) => {
                  const capacity = event.target.value;
                  if (editing) setEditing({ ...editing, capacity });
                  else setDraft({ ...draft, capacity });
                }}
                required
              />
            </label>
            <div className="actions span-2">
              <button className="primary" type="submit">{editing ? "Save table" : "Add table"}</button>
              {editing && <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>}
            </div>
          </form>
          <div className="stack">
            {tables.map((table) => (
              <div className="line" key={table.id}>
                <span>Table {table.tableNumber}</span>
                <span className="actions">
                  <button type="button" className="ghost" onClick={() => setEditing({ ...table })}>Edit</button>
                  <button type="button" className="danger" onClick={() => remove(table)}>Remove</button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
