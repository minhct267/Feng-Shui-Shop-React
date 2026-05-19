import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminOrders } from "../../services/adminApi";

const PAGE_SIZE = 20;

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function deliveryBadge(deliveryDate) {
  if (!deliveryDate) {
    return { label: "Unscheduled", tone: "neutral" };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (deliveryDate < today) return { label: "Past delivery", tone: "warning" };
  if (deliveryDate === today) return { label: "Today", tone: "primary" };
  return { label: "Scheduled", tone: "info" };
}

const TONE_CLASS = {
  info: "bg-secondary-container text-on-secondary-container",
  warning: "bg-tertiary-container text-on-tertiary-container",
  primary: "bg-primary text-on-primary",
  neutral: "bg-surface-container-highest text-on-surface-variant",
  success: "bg-secondary-container text-on-secondary-container",
};

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders({
        search,
        paymentStatus,
        dateFrom,
        dateTo,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, paymentStatus, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setPaymentStatus("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters =
    !!search || paymentStatus !== "all" || !!dateFrom || !!dateTo;

  return (
    <div className="p-8 custom-scrollbar">
      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
            Order Ledger
          </h1>
          <p className="text-on-surface-variant font-light max-w-md mt-2">
            Every patron&apos;s sacred selection, awaiting your blessing or
            already in motion.
          </p>
        </div>
        <span className="font-label text-xs uppercase tracking-widest text-outline">
          {total} {total === 1 ? "Order" : "Orders"}
        </span>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 mb-6 border border-surface-container-high">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
              search
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or order #"
              className="w-full pl-10 pr-3 py-2 bg-transparent border-b border-outline-variant/40 focus:border-primary focus:ring-0 text-sm font-light outline-none transition-colors"
            />
          </div>
          <div>
            <label className="font-label uppercase tracking-widest text-[10px] text-outline block mb-1">
              Payment status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent border-b border-outline-variant/40 py-2 text-sm focus:border-primary outline-none"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <label className="font-label uppercase tracking-widest text-[10px] text-outline block mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent border-b border-outline-variant/40 py-2 text-sm focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="font-label uppercase tracking-widest text-[10px] text-outline block mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent border-b border-outline-variant/40 py-2 text-sm focus:border-primary outline-none"
            />
          </div>
        </div>
        {hasFilters && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="text-[10px] uppercase tracking-widest font-bold text-outline hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">clear</span>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {error && !loading && (
        <div className="bg-error-container text-on-error-container px-5 py-4 rounded-sm text-sm font-label mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container-high">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Order #
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Date
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Customer
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline text-right">
                Items
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline text-right">
                Total
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Payment
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Delivery
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-20 rounded bg-surface-container animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-5xl block mb-3 opacity-30">
                    receipt_long
                  </span>
                  <p className="font-headline italic text-lg text-on-surface mb-1">
                    No orders match the current filters
                  </p>
                  <p className="text-xs">
                    {hasFilters
                      ? "Try clearing filters to see the whole ledger."
                      : "Orders will appear here as patrons begin their journey."}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((o) => {
                const delivery = deliveryBadge(o.DeliveryDate);
                return (
                  <tr
                    key={o.OrderId}
                    onClick={() => navigate(`/admin/orders/${o.OrderId}`)}
                    className="cursor-pointer hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 py-4 font-headline text-on-surface">
                      #{o.OrderId}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {o.OrderDate}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-headline text-sm text-on-surface">
                          {o.CustomerFullName}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-outline">
                          {o.PaymentMethodName || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-on-surface-variant tabular-nums">
                      {o.item_count}
                    </td>
                    <td className="px-6 py-4 text-right font-headline font-bold text-on-surface tabular-nums">
                      {formatPrice(o.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full ${
                          o.PaymentStatus
                            ? TONE_CLASS.success
                            : TONE_CLASS.warning
                        }`}
                      >
                        {o.PaymentStatus ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full ${TONE_CLASS[delivery.tone]}`}
                      >
                        {delivery.label} &middot; {o.DeliveryDate}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant font-light">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-xs tracking-widest uppercase font-bold text-on-surface-variant hover:text-on-surface border border-outline-variant/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-xs text-on-surface-variant px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 text-xs tracking-widest uppercase font-bold text-on-surface-variant hover:text-on-surface border border-outline-variant/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
