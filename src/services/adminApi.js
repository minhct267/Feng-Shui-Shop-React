const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function adminFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.detail || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function fetchAdminDashboard() {
  return adminFetch("/admin/dashboard");
}

export async function fetchAdminOrders({
  search = "",
  paymentStatus = "all",
  dateFrom = "",
  dateTo = "",
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams({
    search,
    payment_status: paymentStatus,
    page: String(page),
    page_size: String(pageSize),
  });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  return adminFetch(`/admin/orders?${params}`);
}

export async function fetchAdminOrderDetail(orderId) {
  return adminFetch(`/admin/orders/${orderId}`);
}

export async function updateOrderPaymentStatus(orderId, paid) {
  return adminFetch(`/admin/orders/${orderId}/payment-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paid }),
  });
}

export async function fetchAdminPromotions() {
  return adminFetch("/admin/promotions");
}

export async function fetchAdminPromotionDetail(promotionId) {
  return adminFetch(`/admin/promotions/${promotionId}`);
}

export async function createPromotion(payload) {
  return adminFetch("/admin/promotions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updatePromotion(promotionId, payload) {
  return adminFetch(`/admin/promotions/${promotionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deletePromotion(promotionId) {
  return adminFetch(`/admin/promotions/${promotionId}`, { method: "DELETE" });
}

export async function fetchAdminCategoriesWithCounts() {
  return adminFetch("/admin/categories");
}

export async function updateCategoryDescription(categoryId, description) {
  return adminFetch(`/admin/categories/${categoryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Description: description }),
  });
}

export async function fetchAdminCustomers({
  search = "",
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams({
    search,
    page: String(page),
    page_size: String(pageSize),
  });
  return adminFetch(`/admin/customers?${params}`);
}

export async function fetchAdminCustomerDetail(customerId) {
  return adminFetch(`/admin/customers/${customerId}`);
}

export async function fetchAdminFeedback({
  topicId = "",
  hasTransaction = "",
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (topicId) params.set("topic_id", String(topicId));
  if (hasTransaction !== "") params.set("has_transaction", hasTransaction);
  return adminFetch(`/admin/feedback?${params}`);
}

export async function fetchFeedbackTopics() {
  return adminFetch("/admin/feedback/topics");
}
