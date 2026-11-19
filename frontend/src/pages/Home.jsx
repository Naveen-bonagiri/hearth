import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api, errorText, isFloor, money, roleLabel, when } from "../api.js";
import { Banner, Chip, Empty } from "../ui.jsx";
import { OrderBoard, TableBoard } from "../floor.jsx";

export default function Home() {
  const { user, token, can } = useAuth();
  const floor = isFloor(user);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [report, setReport] = useState(null);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);

  async function load() {
    setError("");
    try {
      const jobs = [];
      if (can("ORDER_VIEW")) jobs.push(api("/api/orders", { token }).then(setOrders));
      if (can("MENU_VIEW")) jobs.push(api("/api/menu/items", { token }).then(setItems));
      if (can("TABLE_VIEW")) jobs.push(api("/api/tables", { token }).then(setTables));
      if (can("REPORT_VIEW")) jobs.push(api("/api/reports/today", { token }).then(setReport));
      if (can("USER_MANAGE") || can("STAFF_MANAGE")) jobs.push(api("/api/users", { token }).then(setPeople));
      await Promise.all(jobs);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function onStatus(order, status) {
    setNote("");
    setError("");
    try {
      await api(`/api/orders/${order.id}/status`, { method: "PATCH", token, body: { status } });
      setNote(`Table ${order.tableNumber} is now ${status.toLowerCase()}.`);
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function onTable(table, status) {
    setError("");
    try {
      await api(`/api/tables/${table.id}/status`, { method: "PATCH", token, body: { status } });
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  const greeting = user?.roles?.includes("CUSTOMER") && !floor
    ? "Your table is this way."
    : user?.roles?.includes("ADMIN")
      ? "The house keys, the books, and the floor."
      : user?.roles?.includes("MANAGER")
        ? "The board, the menu, and the night’s numbers."
        : "Tickets on the pass, tables on the floor.";

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">{roleLabel(user)}</p>
          <h1>Good evening, {user?.username}.</h1>
          <p className="lede">{greeting}</p>
        </div>
        {can("ORDER_CREATE") && <Link className="button primary" to="/menu">Place an order</Link>}
      </header>
      <Banner>{error}</Banner>
      <Banner kind="ok">{note}</Banner>
      {!ready && <p className="calm">Bringing the book up…</p>}
      {ready && <>

      {can("REPORT_VIEW") && report && (
        <section className="stats">
          <article className="card stat">
            <p className="kicker">Today</p>
            <h2>{report.todayOrders}</h2>
            <p className="muted">orders placed</p>
          </article>
          <article className="card stat">
            <p className="kicker">Revenue</p>
            <h2>{money(report.todayRevenue)}</h2>
            <p className="muted">excluding cancelled</p>
          </article>
        </section>
      )}

      {user?.roles?.includes("ADMIN") && (
        <section className="tools">
          <Link className="tool" to="/users"><strong>Users</strong><span>{people.length} accounts in the book</span></Link>
          <Link className="tool" to="/roles"><strong>Roles</strong><span>Permissions behind every key</span></Link>
          <Link className="tool" to="/reports"><strong>Reports</strong><span>Today’s service, in plain numbers</span></Link>
        </section>
      )}

      {floor && can("ORDER_VIEW") && (
        <section className="stack">
          <div className="page-head">
            <h2>Live board</h2>
            <Link to="/orders">Open the full board</Link>
          </div>
          {orders.length === 0
            ? <Empty>No tickets yet. Place an order from the menu when a table is seated.</Empty>
            : <OrderBoard orders={orders} onStatus={onStatus} />}
        </section>
      )}

      {can("TABLE_VIEW") && (
        <section className="stack">
          <div className="page-head">
            <h2>Tables</h2>
            <Link to="/tables">Manage the floor</Link>
          </div>
          <TableBoard tables={tables} onStatus={onTable} canUpdate={can("TABLE_VIEW")} />
        </section>
      )}

      {!floor && (
        <section className="grid-2">
          <div className="card">
            <h2>Tonight’s menu</h2>
            {items.filter((item) => item.available).slice(0, 5).map((item) => (
              <div className="dish" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
                <span className="price">{money(item.price)}</span>
              </div>
            ))}
            {items.length === 0 && <Empty>The menu is empty. A manager can add the first dish.</Empty>}
            <div style={{ marginTop: "0.8rem" }}><Link to="/menu">See the full menu</Link></div>
          </div>
          <div className="card">
            <h2>Your orders</h2>
            {orders.length === 0 && <Empty>You have no orders yet. Choose a table and send the first one.</Empty>}
            <div className="stack" style={{ marginTop: "0.6rem" }}>
              {orders.slice(0, 4).map((order) => (
                <div key={order.id}>
                  <div className="line">
                    <strong>Table {order.tableNumber}</strong>
                    <Chip value={order.status} />
                  </div>
                  <p className="muted">{when(order.orderedAt)} · {money(order.totalAmount)}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "0.8rem" }}><Link to="/orders">Review your orders</Link></div>
          </div>
        </section>
      )}

      {user?.roles?.includes("MANAGER") && (
        <section className="tools">
          <Link className="tool" to="/menu"><strong>Menu</strong><span>Change a dish, a price, or the list</span></Link>
          <Link className="tool" to="/staff"><strong>Staff</strong><span>{people.length} floor accounts</span></Link>
          <Link className="tool" to="/reports"><strong>Report</strong><span>Popular dishes and status counts</span></Link>
        </section>
      )}
      </>}
    </div>
  );
}
