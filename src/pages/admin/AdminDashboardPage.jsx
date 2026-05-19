import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboard } from "../../services/adminApi";

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatToday() {
  const today = new Date();
  return today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function KpiCard({ eyebrow, value, hint, icon, tone = "default" }) {
  const toneRing = {
    default: "border-outline-variant/30",
    warning: "border-tertiary/40",
  }[tone];
  return (
    <div
      className={`bg-surface-container-lowest p-6 rounded-xl border ${toneRing}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-label uppercase tracking-widest text-[10px] text-outline">
          {eyebrow}
        </span>
        <span className="material-symbols-outlined text-primary text-lg">
          {icon}
        </span>
      </div>
      <p className="text-4xl md:text-5xl font-headline text-on-surface tabular-nums">
        {value}
      </p>
      {hint && (
        <p className="mt-2 text-[11px] text-on-surface-variant font-light">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminDashboard()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-8 custom-scrollbar">
      <div className="mb-10 flex justify-between items-end flex-wrap gap-4">
        <div>
          <span className="font-label uppercase tracking-widest text-xs text-outline block mb-2">
            Aligned for {formatToday()}
          </span>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
            Sanctuary Overview
          </h1>
          <p className="text-on-surface-variant font-light max-w-md mt-2">
            A bird&apos;s-eye view of the curator&apos;s ledger, woven from
            orders, artifacts, and visitor whispers.
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-24 text-on-surface-variant font-label uppercase tracking-widest text-xs flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-sm">
            progress_activity
          </span>
          Aligning the ledger...
        </div>
      )}

      {error && !loading && (
        <div className="bg-error-container text-on-error-container px-5 py-4 rounded-sm text-sm font-label">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <KpiCard
              eyebrow="Revenue (30 days)"
              value={formatPrice(data.revenue_30d)}
              hint={`All-time: ${formatPrice(data.revenue_total)}`}
              icon="payments"
            />
            <KpiCard
              eyebrow="Orders (30 days)"
              value={data.orders_30d}
              hint={`All-time: ${data.orders_total}`}
              icon="receipt_long"
            />
            <KpiCard
              eyebrow="Average Order Value"
              value={formatPrice(data.aov)}
              hint="Across paid &amp; unpaid orders"
              icon="trending_up"
            />
            <KpiCard
              eyebrow="Low Stock Alerts"
              value={data.low_stock_count}
              hint={`${data.unpaid_orders_count} unpaid orders pending`}
              icon="inventory_2"
              tone={data.low_stock_count > 0 ? "warning" : "default"}
            />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 border border-surface-container-high">
              <div className="flex justify-between items-baseline mb-6">
                <h2 className="text-2xl font-headline text-on-surface">
                  Top Artifacts
                </h2>
                <span className="font-label uppercase tracking-widest text-[10px] text-outline">
                  By units sold
                </span>
              </div>
              {data.top_products.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-outline mb-3 block">
                    auto_awesome
                  </span>
                  <p className="font-headline italic text-lg text-on-surface mb-1">
                    The collection is still finding its rhythm
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Top artifacts will appear once the first orders are placed.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-surface-container-high">
                  {data.top_products.map((p, idx) => (
                    <li
                      key={p.ProductId}
                      className="py-3 flex items-center gap-4"
                    >
                      <span className="font-headline italic text-2xl text-outline w-6 text-center">
                        {idx + 1}
                      </span>
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
                        {p.ImageUrl ? (
                          <img
                            src={p.ImageUrl}
                            alt={p.ProductName}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                            <span className="material-symbols-outlined">
                              image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-headline text-on-surface truncate">
                          {p.ProductName}
                        </p>
                        <p className="text-[11px] uppercase tracking-widest text-outline">
                          {p.units_sold} sold &middot; {formatPrice(p.revenue)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-8 border border-surface-container-high">
              <div className="flex justify-between items-baseline mb-6">
                <h2 className="text-2xl font-headline text-on-surface">
                  Recent Orders
                </h2>
                <Link
                  to="/admin/orders"
                  className="text-[10px] uppercase tracking-widest text-primary font-bold hover:underline"
                >
                  View all
                </Link>
              </div>
              {data.recent_orders.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-outline mb-3 block">
                    receipt_long
                  </span>
                  <p className="font-headline italic text-lg text-on-surface">
                    No orders yet
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-surface-container-high">
                  {data.recent_orders.map((o) => (
                    <li key={o.OrderId} className="py-3">
                      <Link
                        to={`/admin/orders/${o.OrderId}`}
                        className="flex items-center justify-between gap-3 hover:text-primary transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-headline text-sm">
                            #{o.OrderId} &middot; {o.CustomerFullName}
                          </p>
                          <p className="text-[11px] uppercase tracking-widest text-outline">
                            {o.OrderDate}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline text-sm tabular-nums">
                            {formatPrice(o.total)}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-[9px] uppercase tracking-widest rounded-full ${
                              o.PaymentStatus
                                ? "bg-secondary-container text-on-secondary-container"
                                : "bg-tertiary-container text-on-tertiary-container"
                            }`}
                          >
                            {o.PaymentStatus ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-surface-container-highest rounded-xl p-8">
            <div className="flex justify-between items-baseline mb-6">
              <div>
                <h2 className="text-2xl font-headline text-primary">
                  Curator&apos;s Inbox
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Whispers from visitors and patrons.
                </p>
              </div>
              <Link
                to="/admin/feedback"
                className="text-[10px] uppercase tracking-widest text-primary font-bold hover:underline"
              >
                Open inbox
              </Link>
            </div>
            {data.recent_feedback.length === 0 ? (
              <p className="py-8 text-center text-on-surface-variant text-sm font-light italic">
                The inbox is silent for now.
              </p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.recent_feedback.map((f) => (
                  <li
                    key={f.FeedbackId}
                    className="bg-surface-container-lowest rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-headline text-sm">{f.FullName}</span>
                      <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[9px] uppercase tracking-widest rounded-full">
                        {f.TopicName}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-3 font-light italic">
                      &ldquo;{f.Snippet}&rdquo;
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-outline">
                      {f.FeedbackDate}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
