import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { errorText } from "../api.js";
import { Banner } from "../ui.jsx";
import { HouseKeys } from "../site.jsx";

const ROLES = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "STAFF", label: "Staff" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username.trim(), password, role);
      navigate("/");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="login-card">
        <p className="kicker">Welcome back</p>
        <h1>Log in</h1>
        <p className="house-line">Choose the role that belongs to this account. A mismatch will not sign you in.</p>
        <form onSubmit={onSubmit}>
          <Banner>{error}</Banner>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <label>
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <button className="primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
        </form>
        <p className="lede" style={{ marginTop: "0.9rem" }}>
          New here? <Link to="/register">Sign up as a customer</Link>
        </p>
      </section>
      <HouseKeys />
    </div>
  );
}
