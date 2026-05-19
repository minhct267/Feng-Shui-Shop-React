import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminCustomers } from "../../services/adminApi";

const PAGE_SIZE = 20;

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function initials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "?";
}

export default function AdminCustomersPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminCustomers({
        search,
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
  }, [search, page]);

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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-8 custom-scrollbar">
      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
            Patrons
          </h1>
          <p className="text-on-surface-variant font-light max-w-md mt-2">
            The patrons drawn to the sanctuary, with their spend and order
            history at a glance.
          </p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email or phone"
            className="pl-10 pr-4 py-2 bg-transparent border-b border-outline-variant/40 focus:border-primary focus:ring-0 text-sm font-light w-72 outline-none transition-colors"
          />
        </div>
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
                Patron
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Contact
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline text-right">
                Orders
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline text-right">
                Lifetime Spend
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-surface-container animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-16 text-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-5xl block mb-3 opacity-30">
                    group
                  </span>
                  <p className="font-headline italic text-lg text-on-surface mb-1">
                    No patrons match your query
                  </p>
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr
                  key={c.CustomerId}
                  onClick={() => navigate(`/admin/customers/${c.CustomerId}`)}
                  className="cursor-pointer hover:bg-surface-container-low transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-headline text-primary text-sm">
                        {initials(c.FullName)}
                      </div>
                      <div>
                        <p className="font-headline text-on-surface">
                          {c.FullName}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-outline">
                          @{c.Username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {c.Email && (
                      <p className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">
                          mail
                        </span>
                        <span className="truncate max-w-[20ch]">{c.Email}</span>
                      </p>
                    )}
                    {c.Phone && (
                      <p className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-sm text-primary">
                          call
                        </span>
                        {c.Phone}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-label tabular-nums">
                    {c.order_count}
                  </td>
                  <td className="px-6 py-4 text-right font-headline font-bold tabular-nums">
                    {formatPrice(c.total_spend)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant font-light">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total} patrons
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
