const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function fetchProducts(page = 1, pageSize = 30) {
  const params = new URLSearchParams({ page, page_size: pageSize });
  const res = await fetch(`${API_BASE}/products?${params}`);
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

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
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

export async function checkProductName(name, excludeId) {
  const params = new URLSearchParams({ name });
  if (excludeId != null) params.set("exclude_id", excludeId);
  const res = await fetch(
    `${API_BASE}/admin/products/check-name?${params}`,
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

export async function fetchProductDetail(productId) {
  const res = await fetch(`${API_BASE}/products/${productId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch product detail");
  }
  return res.json();
}

export async function fetchPaymentMethods() {
  const res = await fetch(`${API_BASE}/payment-methods`);
  if (!res.ok) throw new Error("Failed to fetch payment methods");
  return res.json();
}

export async function fetchCart() {
  const res = await fetch(`${API_BASE}/cart`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch cart");
  }
  return res.json();
}

export async function addCartItem(productId, quantity) {
  const res = await fetch(`${API_BASE}/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add to cart");
  }
  return res.json();
}

export async function updateCartItem(productId, quantity) {
  const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update cart item");
  }
  return res.json();
}

export async function removeCartItem(productId) {
  const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to remove cart item");
  }
  return res.json();
}

export async function clearCart() {
  const res = await fetch(`${API_BASE}/cart`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to clear cart");
  }
  return res.json();
}

export async function submitCheckout(payload) {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.detail || "Checkout failed");
    error.status = res.status;
    throw error;
  }
  return res.json();
}
