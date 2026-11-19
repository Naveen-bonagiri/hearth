import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errorText, money, when } from "../api.js";
import { Empty } from "../ui.jsx";
import { OrderBoard } from "../floor.jsx";
import { useNotice } from "../notice.jsx";

export function PastOrdersPage() {
  return (
    <div className="stack narrow">
      <header className="page-head">
        <div>
          <p className="kicker">Orders</p>
          <h1>What you sent</h1>
        </div>
      </header>
      <PastOrders />
    </div>
  );
}

export function PastOrders() {
  const { token } = useAuth();
  const { toast, confirm } = useNotice();
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);

  async function load() {
    const [nextOrders, nextMenu] = await Promise.all([
      api("/api/orders", { token }),
      api("/api/menu/items", { token }),
    ]);
    setOrders(nextOrders);
    setMenu(nextMenu.filter((item) => item.available));
  }

  useEffect(() => {
    load().catch((err) => toast("bad", errorText(err)));
  }, [token]);

  return (
    <div>
      {orders.length === 0 && <Empty>You have no orders yet.</Empty>}
      <ul className="plain">
        {orders.map((order) => (
          <CustomerOrder
            key={order.id}
            order={order}
            menu={menu}
            token={token}
            confirm={confirm}
            toast={toast}
            onChanged={load}
          />
        ))}
      </ul>
    </div>
  );
}

export default function Orders() {
  const { token } = useAuth();
  const { toast, confirm } = useNotice();
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setOrders(await api("/api/orders", { token }));
  }

  useEffect(() => {
    load().catch((err) => toast("bad", errorText(err)));
  }, [token]);

  async function onStatus(order, status) {
    if (status === "CANCELLED") {
      const yes = await confirm("Do you really want to cancel this order?");
      if (!yes) return;
    }
    setBusy(true);
    try {
      await api(`/api/orders/${order.id}/status`, { method: "PATCH", token, body: { status } });
      const kind = status === "CANCELLED" ? "bad" : status === "PREPARING" || status === "CONFIRMED" ? "wait" : "ok";
      toast(kind, `Table ${order.tableNumber} is ${status.toLowerCase()}.`);
      await load();
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
          <p className="kicker">The pass</p>
          <h1>Orders</h1>
          <p className="lede">Move a ticket as the kitchen moves. Serving or cancelling frees the table when nothing else is open.</p>
        </div>
      </header>
      {orders.length === 0 && <Empty>No tickets yet. A customer order will show up here.</Empty>}
      {orders.length > 0 && <OrderBoard orders={orders} onStatus={onStatus} busy={busy} />}
    </div>
  );
}

function CustomerOrder({ order, menu, token, confirm, toast, onChanged }) {
  const [lines, setLines] = useState(() => order.items.map(toLine));
  const [busy, setBusy] = useState(false);
  const pending = order.status === "PENDING";
  const summary = order.items.map((item) => `${item.quantity} ${item.menuItemName}`).join(", ");

  useEffect(() => {
    setLines(order.items.map(toLine));
  }, [order]);

  function setQty(menuItemId, quantity) {
    setLines((current) => current.flatMap((line) => {
      if (line.menuItemId !== menuItemId) return [line];
      if (quantity < 1) return [];
      return [{ ...line, quantity }];
    }));
  }

  async function save() {
    if (!lines.length) {
      toast("bad", "Leave at least one dish, or cancel the order.");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/orders/${order.id}`, {
        method: "PUT",
        token,
        body: { items: lines.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })) },
      });
      toast("ok", "Order saved.");
      await onChanged();
    } catch (err) {
      toast("bad", errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const yes = await confirm("Do you really want to cancel this order?");
    if (!yes) return;
    setBusy(true);
    try {
      await api(`/api/orders/${order.id}/cancel`, { method: "POST", token });
      toast("bad", "Order cancelled.");
      await onChanged();
    } catch (err) {
      toast("bad", errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li>
      <span>Table {order.tableNumber} · {order.status.toLowerCase()} · {money(order.totalAmount)} · {when(order.orderedAt)}</span>
      <span className="muted">{summary}</span>
      {pending && (
        <span className="actions">
          {lines.map((line) => (
            <span className="qty" key={line.menuItemId}>
              {line.name}
              <button type="button" onClick={() => setQty(line.menuItemId, line.quantity - 1)}>-</button>
              {line.quantity}
              <button type="button" onClick={() => setQty(line.menuItemId, line.quantity + 1)}>+</button>
            </span>
          ))}
          <select onChange={(event) => {
            const item = menu.find((dish) => String(dish.id) === event.target.value);
            if (!item) return;
            setLines((current) => current.some((line) => line.menuItemId === item.id)
              ? current
              : [...current, { menuItemId: item.id, name: item.name, quantity: 1 }]);
            event.target.value = "";
          }} defaultValue="">
            <option value="">Add a dish</option>
            {menu.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button type="button" disabled={busy} onClick={save}>Save</button>
          <button type="button" className="ghost" disabled={busy} onClick={cancel}>Cancel</button>
        </span>
      )}
    </li>
  );
}

function toLine(item) {
  return {
    menuItemId: item.menuItemId,
    name: item.menuItemName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  };
}
