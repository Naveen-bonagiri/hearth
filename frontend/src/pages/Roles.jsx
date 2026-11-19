import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errorText } from "../api.js";
import { Empty } from "../ui.jsx";
import { useNotice } from "../notice.jsx";

export default function Roles() {
  const { token } = useAuth();
  const { toast, confirm } = useNotice();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState({});

  async function load() {
    const [nextRoles, nextPermissions] = await Promise.all([
      api("/api/roles", { token }),
      api("/api/permissions", { token }),
    ]);
    setRoles(nextRoles);
    setPermissions(nextPermissions);
    const map = {};
    nextRoles.forEach((role) => {
      map[role.id] = role.permissions.map((permission) => permission.id);
    });
    setSelected(map);
  }

  useEffect(() => {
    load().catch((err) => toast("bad", errorText(err)));
  }, [token]);

  function toggle(roleId, permissionId) {
    setSelected((current) => {
      const ids = current[roleId] || [];
      const next = ids.includes(permissionId) ? ids.filter((id) => id !== permissionId) : [...ids, permissionId];
      return { ...current, [roleId]: next };
    });
  }

  async function save(role) {
    const yes = await confirm(`Do you really want to change the ${role.name} role?`);
    if (!yes) return;
    try {
      await api(`/api/roles/${role.id}/permissions`, {
        method: "PUT",
        token,
        body: { permissionIds: selected[role.id] || [] },
      });
      toast("ok", `${role.name} saved.`);
      await load();
    } catch (err) {
      toast("bad", errorText(err));
    }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="kicker">Keys</p>
          <h1>Roles</h1>
          <p className="lede">Each role holds a set of permissions. The admin role keeps user and role management.</p>
        </div>
      </header>
      {roles.length === 0 && <Empty>No roles are configured.</Empty>}
      <div className="roles">
        {roles.map((role) => (
          <article className="sheet stack" key={role.id}>
            <h2>{role.name}</h2>
            <div className="checks">
              {permissions.map((permission) => (
                <label key={permission.id}>
                  <input
                    type="checkbox"
                    checked={(selected[role.id] || []).includes(permission.id)}
                    onChange={() => toggle(role.id, permission.id)}
                  />
                  {permission.name}
                </label>
              ))}
            </div>
            <button className="primary" type="button" onClick={() => save(role)}>Save {role.name}</button>
          </article>
        ))}
      </div>
    </div>
  );
}
