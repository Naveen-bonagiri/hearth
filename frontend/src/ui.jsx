import { NavLink, Navigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { isFloor, roleLabel } from "./api.js";

const TONE = {
  PENDING: "wait",
  CONFIRMED: "wait",
  PREPARING: "fire",
  READY: "good",
  SERVED: "good",
  CANCELLED: "bad",
  AVAILABLE: "good",
  OCCUPIED: "fire",
  RESERVED: "wait",
};

export function Chip({ value }) {
  const tone = TONE[value] || "wait";
  return <span className={`chip ${tone}`}>{String(value || "").replaceAll("_", " ")}</span>;
}

export function Banner({ kind = "bad", children }) {
  if (!children) return null;
  return <div className={`banner ${kind === "ok" ? "ok" : ""}`} role="alert">{children}</div>;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Shell({ children }) {
  const { user, logout, can } = useAuth();
  const floor = isFloor(user);
  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand">Hearth</NavLink>
        <nav>
          {can("MENU_VIEW") && <NavLink to="/menu">Menu</NavLink>}
          {can("ORDER_VIEW") && <NavLink to="/orders">{floor ? "Orders" : "My orders"}</NavLink>}
          {can("TABLE_VIEW") && <NavLink to="/tables">Tables</NavLink>}
          {can("STAFF_MANAGE") && <NavLink to="/staff">Staff</NavLink>}
          {can("USER_MANAGE") && <NavLink to="/users">Users</NavLink>}
          {can("ROLE_MANAGE") && <NavLink to="/roles">Roles</NavLink>}
          {can("REPORT_VIEW") && <NavLink to="/reports">Reports</NavLink>}
        </nav>
        <div className="who">
          <span>{user?.username}</span>
          <em>{roleLabel(user)}</em>
          <button type="button" className="ghost" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="calm">Lighting the fire…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

export function RequirePerm({ perm, children }) {
  const { can, loading, user } = useAuth();
  if (loading) return <p className="calm">Lighting the fire…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!can(perm)) {
    return (
      <Shell>
        <section className="card">
          <p className="kicker">Access denied</p>
          <h1>That part of the house is closed.</h1>
          <p className="lede">You do not have permission to do that.</p>
        </section>
      </Shell>
    );
  }
  return <Shell>{children}</Shell>;
}
