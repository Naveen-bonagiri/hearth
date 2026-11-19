import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errorText } from "../api.js";
import { Empty } from "../ui.jsx";
import { useNotice } from "../notice.jsx";

const ALL_ROLES = ["ADMIN", "MANAGER", "STAFF", "CUSTOMER"];

export default function People({ mode }) {
  const { token, can } = useAuth();
  const { toast, confirm } = useNotice();
  const staffMode = mode === "staff";
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState({ username: "", email: "", password: "", roles: staffMode ? ["STAFF"] : ["CUSTOMER"] });

  async function load() {
    setPeople(await api("/api/users", { token }));
  }

  useEffect(() => {
    load().catch((err) => toast("bad", errorText(err)));
  }, [token, mode]);

  function toggleRole(role) {
    setForm((current) => {
      const roles = current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role];
      return { ...current, roles };
    });
  }

  async function create(event) {
    event.preventDefault();
    try {
      await api("/api/users", {
        method: "POST",
        token,
        body: {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          enabled: true,
          roles: staffMode ? ["STAFF"] : form.roles,
        },
      });
      toast("ok", staffMode ? "Staff account saved." : "Account saved.");
      setForm({ username: "", email: "", password: "", roles: staffMode ? ["STAFF"] : ["CUSTOMER"] });
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  async function setEnabled(person, enabled) {
    if (!enabled) {
      const yes = await confirm(`Do you really want to disable ${person.username}?`);
      if (!yes) return;
    }
    try {
      await api(`/api/users/${person.id}/enabled`, { method: "PATCH", token, body: { enabled } });
      toast(enabled ? "ok" : "bad", enabled ? `${person.username} is enabled.` : `${person.username} is disabled.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  async function saveRoles(person, roles) {
    const yes = await confirm(`Do you really want to change the role for ${person.username}?`);
    if (!yes) return;
    try {
      await api(`/api/users/${person.id}`, {
        method: "PUT",
        token,
        body: {
          username: person.username,
          email: person.email,
          enabled: person.enabled,
          roles,
        },
      });
      toast("ok", `Role saved for ${person.username}.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">{staffMode ? "The floor" : "The book"}</p>
          <h1>{staffMode ? "Staff" : "Users"}</h1>
          <p className="lede">
            {staffMode
              ? "Open a floor account, or close one when someone leaves the shift."
              : "Admins can open any account, change its roles, or disable a key."}
          </p>
        </div>
      </header>
      <form className="sheet" onSubmit={create}>
        <label>
          Username
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required minLength={3} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} />
        </label>
        {!staffMode && (
          <div className="checks">
            {ALL_ROLES.map((role) => (
              <label key={role}>
                <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                {role}
              </label>
            ))}
          </div>
        )}
        <button className="primary" type="submit">{staffMode ? "Add staff" : "Add user"}</button>
      </form>
      {people.length === 0 && <Empty>{staffMode ? "No staff accounts yet. Add the first one above." : "No accounts yet."}</Empty>}
      <div className="people">
        {people.map((person) => (
          <PersonRow
            key={person.id}
            person={person}
            staffMode={staffMode}
            canEditRoles={can("USER_MANAGE")}
            onEnabled={setEnabled}
            onRoles={saveRoles}
          />
        ))}
      </div>
    </div>
  );
}

function PersonRow({ person, staffMode, canEditRoles, onEnabled, onRoles }) {
  const [roles, setRoles] = useState(person.roles);
  useEffect(() => setRoles(person.roles), [person]);

  return (
    <article className="person">
      <div>
        <strong>{person.username}</strong>
        <p className="muted">{person.email}</p>
      </div>
      <div className="actions">
        <span className={`chip ${person.enabled ? "good" : "bad"}`}>{person.enabled ? "Enabled" : "Disabled"}</span>
        {person.roles.map((role) => <span key={role} className="chip wait">{role}</span>)}
      </div>
      <div className="stack">
        <button type="button" className={person.enabled ? "danger" : "primary"} onClick={() => onEnabled(person, !person.enabled)}>
          {person.enabled ? "Disable" : "Enable"}
        </button>
        {canEditRoles && !staffMode && (
          <>
            <div className="checks">
              {ALL_ROLES.map((role) => (
                <label key={role}>
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => setRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])}
                  />
                  {role}
                </label>
              ))}
            </div>
            <button type="button" onClick={() => onRoles(person, roles)}>Save roles</button>
          </>
        )}
      </div>
    </article>
  );
}
