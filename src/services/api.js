const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Fetch products
export async function fetchProducts(page = 1, pageSize = 30) {
  const params = new URLSearchParams({ page, page_size: pageSize });
  const res = await fetch(`${API_BASE}/products?${params}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

// Fetch categories
export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

// Login user
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

// Fetch current user
export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

// Logout user
export async function logoutUser() {
  const res = await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Logout failed");
  return res.json();
}

// Fetch promotions
export async function fetchPromotions() {
  const res = await fetch(`${API_BASE}/promotions`);
  if (!res.ok) throw new Error("Failed to fetch promotions");
  return res.json();
}

// Check product name
export async function checkProductName(name, excludeId) {
  const params = new URLSearchParams({ name });
  if (excludeId != null) params.set("exclude_id", excludeId);
  const res = await fetch(`${API_BASE}/admin/products/check-name?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to check name");
  return res.json();
}

// Create product
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

// Fetch all products in admin portal
export async function fetchAdminProducts(search = "", page = 1, pageSize = 10) {
  const params = new URLSearchParams({ search, page, page_size: pageSize });
  const res = await fetch(`${API_BASE}/admin/products/list?${params}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch products");
  }
  return res.json();
}

// Fetch product detail in admin portal
export async function fetchAdminProductDetail(productId) {
  const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch product detail");
  }
  return res.json();
}

// Update product
export async function updateProduct(productId, formData) {
  const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update product");
  }
  return res.json();
}

// Delete product
export async function deleteProduct(productId) {
  const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete product");
  }
  return res.json();
}
