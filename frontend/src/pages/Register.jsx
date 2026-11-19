import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { errorText } from "../api.js";
import { Banner } from "../ui.jsx";
import { HouseKeys } from "../site.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
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
        <p className="kicker">Customer account</p>
        <h1>Sign up</h1>
        <p className="house-line">This creates a customer account. Staff and managers are added by the house, not from this form.</p>
        <form onSubmit={onSubmit}>
          <Banner>{error}</Banner>
          <label>
            Name
            <input value={form.username} onChange={set("username")} required minLength={3} autoComplete="username" />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={set("email")} required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={set("password")} required minLength={8} autoComplete="new-password" />
          </label>
          <button className="primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Create customer account"}</button>
        </form>
        <p className="lede" style={{ marginTop: "0.9rem" }}>
          Already a customer? <Link to="/login">Log in</Link>
        </p>
      </section>
      <HouseKeys />
    </div>
  );
}
