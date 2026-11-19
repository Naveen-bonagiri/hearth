import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api, errorText, money } from "../api.js";
import { Empty } from "../ui.jsx";
import { OrderBoard, TableBoard } from "../floor.jsx";
import { useNotice } from "../notice.jsx";
import { SeatList } from "../seats.jsx";

export function StaffHome() {
  const { token } = useAuth();
  const { toast, confirm } = useNotice();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);

  async function load() {
    const [nextOrders, nextTables] = await Promise.all([
      api("/api/orders", { token }),
      api("/api/tables", { token }),
    ]);
    setOrders(nextOrders);
    setTables(nextTables);
  }

  useEffect(() => {
    load().catch((err) => toast("bad", errorText(err)));
  }, [token]);

  async function onStatus(order, status) {
    if (status === "CANCELLED") {
      const yes = await confirm("Do you really want to cancel this order?");
      if (!yes) return;
    }
    try {
      await api(`/api/orders/${order.id}/status`, { method: "PATCH", token, body: { status } });
      const kind = status === "CANCELLED" ? "bad" : status === "PREPARING" || status === "CONFIRMED" ? "wait" : "ok";
      toast(kind, `Table ${order.tableNumber} is ${status.toLowerCase()}.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  async function onTable(table, status) {
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

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">Staff</p>
          <h1>The pass</h1>
          <p className="lede">This desk is the live order board and the tables. Move a ticket, then mark the table.</p>
        </div>
      </header>
      <section className="stack">
        <h2>Live orders</h2>
        {orders.length === 0
          ? <Empty>No tickets yet.</Empty>
          : <OrderBoard orders={orders} onStatus={onStatus} />}
      </section>
      <section className="stack">
        <h2>Tables</h2>
        <TableBoard tables={tables} onStatus={onTable} canUpdate />
        <SeatList />
      </section>
    </div>
  );
}

export function ManagerHome() {
  const { token } = useAuth();
  const { toast } = useNotice();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api("/api/reports/today", { token }).then(setReport).catch((err) => toast("bad", errorText(err)));
  }, [token]);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">Manager</p>
          <h1>Tonight’s service</h1>
          <p className="lede">This desk is for the menu, the staff accounts, today’s numbers, and the floor.</p>
        </div>
      </header>
      <section className="tools">
        <Link className="tool" to="/menu"><strong>Edit the menu</strong><span>Dishes, prices, and what is available</span></Link>
        <Link className="tool" to="/staff"><strong>Staff accounts</strong><span>Open or close a floor account</span></Link>
        <Link className="tool" to="/reports"><strong>Today’s report</strong><span>{report ? `${report.todayOrders} orders · ${money(report.todayRevenue)}` : "Orders, revenue, and popular dishes"}</span></Link>
      </section>
      <section className="tools">
        <Link className="tool" to="/orders"><strong>Orders</strong><span>The live board</span></Link>
        <Link className="tool" to="/tables"><strong>Tables</strong><span>Seat, hold, or free a table</span></Link>
      </section>
    </div>
  );
}

export function AdminHome() {
  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">Admin</p>
          <h1>The house book</h1>
          <p className="lede">This desk decides who may come in, and what each role is allowed to do. The floor tools are here too, under the book.</p>
        </div>
      </header>
      <section className="tools">
        <Link className="tool tool-lead" to="/users"><strong>Users</strong><span>Open an account, change its role, or disable a key</span></Link>
        <Link className="tool tool-lead" to="/roles"><strong>Roles</strong><span>The permissions behind Customer, Staff, Manager, and Admin</span></Link>
      </section>
      <section className="stack">
        <h2>House tools</h2>
        <div className="tools">
          <Link className="tool" to="/menu"><strong>Menu</strong><span>Edit dishes and prices</span></Link>
          <Link className="tool" to="/staff"><strong>Staff</strong><span>Floor accounts</span></Link>
          <Link className="tool" to="/reports"><strong>Reports</strong><span>Today’s service</span></Link>
          <Link className="tool" to="/orders"><strong>Orders</strong><span>The live board</span></Link>
          <Link className="tool" to="/tables"><strong>Tables</strong><span>The floor</span></Link>
        </div>
      </section>
    </div>
  );
}
