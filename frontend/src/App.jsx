import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Menu from "./pages/Menu.jsx";
import Orders, { PastOrdersPage } from "./pages/Orders.jsx";
import Tables from "./pages/Tables.jsx";
import People from "./pages/People.jsx";
import Roles from "./pages/Roles.jsx";
import Reports from "./pages/Reports.jsx";
import { About, Faq, PublicHome, PublicMenu, Visit } from "./pages/Public.jsx";
import { CartProvider, Checkout, CustomerFrame, CustomerHome, CustomerMenu, Settings, TableAsk } from "./pages/Customer.jsx";
import { AdminHome, ManagerHome, StaffHome } from "./pages/Work.jsx";
import { useAuth } from "./auth.jsx";
import { primaryRole } from "./api.js";
import { PublicFrame, WorkFrame } from "./site.jsx";

const STAFF_LINKS = [
  { to: "/", label: "Pass", end: true },
  { to: "/orders", label: "Orders" },
  { to: "/tables", label: "Tables" },
];

const MANAGER_LINKS = [
  { to: "/", label: "Service", end: true },
  { to: "/menu", label: "Menu" },
  { to: "/orders", label: "Orders" },
  { to: "/tables", label: "Tables" },
  { to: "/staff", label: "Staff" },
  { to: "/reports", label: "Reports" },
];

const ADMIN_LINKS = [
  { to: "/", label: "House book", end: true },
  { to: "/users", label: "Users" },
  { to: "/roles", label: "Roles" },
  { to: "/menu", label: "Menu" },
  { to: "/orders", label: "Orders" },
  { to: "/tables", label: "Tables" },
  { to: "/staff", label: "Staff" },
  { to: "/reports", label: "Reports" },
];

function PublicRoutes() {
  return (
    <PublicFrame>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/menu" element={<PublicMenu />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/visit" element={<Visit />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicFrame>
  );
}

function CustomerRoutes() {
  return (
    <CartProvider>
      <CustomerFrame>
        <Routes>
          <Route path="/" element={<CustomerHome />} />
          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<PastOrdersPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/table" element={<TableAsk />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CustomerFrame>
    </CartProvider>
  );
}

function StaffRoutes() {
  return (
    <WorkFrame links={STAFF_LINKS}>
      <Routes>
        <Route path="/" element={<StaffHome />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WorkFrame>
  );
}

function ManagerRoutes() {
  return (
    <WorkFrame links={MANAGER_LINKS}>
      <Routes>
        <Route path="/" element={<ManagerHome />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/staff" element={<People mode="staff" />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WorkFrame>
  );
}

function AdminRoutes() {
  return (
    <WorkFrame links={ADMIN_LINKS}>
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/users" element={<People mode="users" />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/staff" element={<People mode="staff" />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WorkFrame>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="calm">Lighting the fire…</p>;
  if (!user) return <PublicRoutes />;
  const role = primaryRole(user);
  if (role === "CUSTOMER") return <CustomerRoutes />;
  if (role === "STAFF") return <StaffRoutes />;
  if (role === "MANAGER") return <ManagerRoutes />;
  if (role === "ADMIN") return <AdminRoutes />;
  return <PublicRoutes />;
}
