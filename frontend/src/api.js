export async function api(path, { method = "GET", body, token } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!response.ok) {
    const error = new Error(data?.message || "Request failed.");
    error.status = response.status;
    error.fields = data?.fields || null;
    throw error;
  }
  return data;
}

export function errorText(error) {
  if (!error) return "";
  if (error.fields && Object.keys(error.fields).length) {
    return Object.entries(error.fields).map(([key, value]) => `${key}: ${value}`).join(" · ");
  }
  return error.message || "Something went wrong.";
}

export function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

export function when(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function primaryRole(user) {
  const roles = user?.roles || [];
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("MANAGER")) return "MANAGER";
  if (roles.includes("STAFF")) return "STAFF";
  if (roles.includes("CUSTOMER")) return "CUSTOMER";
  return "";
}

export function roleLabel(user) {
  const role = primaryRole(user);
  if (role === "ADMIN") return "Admin";
  if (role === "MANAGER") return "Manager";
  if (role === "STAFF") return "Staff";
  if (role === "CUSTOMER") return "Customer";
  return "";
}

export function isFloor(user) {
  return !!user?.roles?.some((role) => role === "STAFF" || role === "MANAGER" || role === "ADMIN");
}
