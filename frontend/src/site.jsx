import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./auth.jsx";
import { roleLabel } from "./api.js";

export function Footer() {
  return (
    <footer className="site-footer">
      <strong>Hearth</strong>
      <p>A short menu, cooked over a real fire.</p>
      <p>Made with ♥ in India</p>
      <p>All rights reserved</p>
    </footer>
  );
}

export function PublicFrame({ children }) {
  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand" end>Hearth</NavLink>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to="/visit">Visit</NavLink>
        </nav>
        <div className="who">
          <NavLink className="button ghost" to="/login">Log in</NavLink>
          <NavLink className="button primary" to="/register">Sign up</NavLink>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function WorkFrame({ links, children }) {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand" end>Hearth</NavLink>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
          ))}
        </nav>
        <div className="who">
          <span>{user?.username}</span>
          <em>{roleLabel(user)}</em>
          <button type="button" className="ghost" onClick={logout}>Log out</button>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function HouseKeys() {
  const [open, setOpen] = useState(false);
  return (
    <div className="keys-dock">
      {open && (
        <div className="keys-pop" role="dialog" aria-label="House keys">
          <div className="line">
            <strong>House keys</strong>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>Close</button>
          </div>
          <p className="muted">admin</p>
          <p className="muted">manager</p>
          <p className="muted">staff</p>
          <p className="muted">customer</p>
          <p><strong>Password123!</strong></p>
        </div>
      )}
      {!open && (
        <button type="button" className="keys-tab" onClick={() => setOpen(true)}>House keys</button>
      )}
    </div>
  );
}
