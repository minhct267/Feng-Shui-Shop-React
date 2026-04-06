const API_BASE = "/api";

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function logoutUser() {
  const res = await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Logout failed");
  return res.json();
}

export async function fetchPromotions() {
  const res = await fetch(`${API_BASE}/promotions`);
  if (!res.ok) throw new Error("Failed to fetch promotions");
  return res.json();
}

export async function checkProductName(name) {
  const res = await fetch(
    `${API_BASE}/admin/products/check-name?name=${encodeURIComponent(name)}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to check name");
  return res.json();
}

export async function createProduct(formData) {
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create product");
  }
  return res.json();
}
