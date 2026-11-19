import { Chip, Empty } from "./ui.jsx";
import { money, when } from "./api.js";

const OPEN = ["PENDING", "CONFIRMED", "PREPARING", "READY"];
const NEXT = {
  PENDING: [
    { status: "CONFIRMED", label: "Confirm" },
    { status: "CANCELLED", label: "Cancel ticket", danger: true },
  ],
  CONFIRMED: [
    { status: "PREPARING", label: "Start cooking" },
    { status: "CANCELLED", label: "Cancel ticket", danger: true },
  ],
  PREPARING: [{ status: "READY", label: "Mark ready" }],
  READY: [{ status: "SERVED", label: "Mark served" }],
};

export function OrderBoard({ orders, onStatus, busy }) {
  const open = OPEN.map((status) => ({
    status,
    tickets: orders.filter((order) => order.status === status),
  }));
  const finished = orders.filter((order) => order.status === "SERVED" || order.status === "CANCELLED");
  return (
    <div>
      <div className="board">
        {open.map((column) => (
          <section className="card column" key={column.status}>
            <Chip value={column.status} />
            {column.tickets.length === 0 && <p className="muted" style={{ marginTop: "0.7rem" }}>Nothing here.</p>}
            {column.tickets.map((order) => (
              <article className="ticket" key={order.id}>
                <strong>Table {order.tableNumber}</strong>
                <div className="meta">{order.username} · {when(order.orderedAt)}</div>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>{item.quantity} × {item.menuItemName}</li>
                  ))}
                </ul>
                <strong>{money(order.totalAmount)}</strong>
                <div className="actions">
                  {(NEXT[order.status] || []).map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      className={action.danger ? "danger" : "primary"}
                      disabled={busy}
                      onClick={() => onStatus(order, action.status)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
      <details className="done">
        <summary>{finished.length} finished tonight</summary>
        <div className="stack" style={{ marginTop: "0.7rem" }}>
          {finished.length === 0 && <Empty>Served and cancelled tickets will rest here.</Empty>}
          {finished.map((order) => (
            <article className="card" key={order.id}>
              <div className="line">
                <strong>Table {order.tableNumber}</strong>
                <Chip value={order.status} />
              </div>
              <p className="muted">{order.items.map((item) => `${item.quantity} × ${item.menuItemName}`).join(", ")} · {money(order.totalAmount)}</p>
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}

export function TableBoard({ tables, onStatus, canUpdate }) {
  if (!tables.length) {
    return <Empty>No tables yet. Add one so the floor has somewhere to seat a party.</Empty>;
  }
  return (
    <div className="tables">
      {tables.map((table) => (
        <article className="card table-card" key={table.id}>
          <div className="line">
            <strong>{table.tableNumber}</strong>
            <Chip value={table.status} />
          </div>
          <p className="muted">Seats {table.capacity}</p>
          {canUpdate && (
            <div className="actions">
              {["AVAILABLE", "OCCUPIED", "RESERVED"].filter((status) => status !== table.status).map((status) => (
                <button key={status} type="button" className="ghost" onClick={() => onStatus(table, status)}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
