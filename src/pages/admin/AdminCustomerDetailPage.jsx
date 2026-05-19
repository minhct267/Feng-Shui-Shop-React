import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchAdminCustomerDetail } from "../../services/adminApi";

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

export default function AdminCustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminCustomerDetail(customerId)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-on-surface-variant font-label uppercase tracking-widest text-xs flex items-center justify-center gap-2">
        <span className="material-symbols-outlined animate-spin text-sm">
          progress_activity
        </span>
        Channeling patron profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-headline text-on-surface mb-4">
          Patron not found
        </h1>
        <p className="text-on-surface-variant mb-8">
          {error || "This patron is no longer in the registry."}
        </p>
        <button
          onClick={() => navigate("/admin/customers")}
          className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label uppercase tracking-widest text-xs"
        >
          Return to patrons
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 custom-scrollbar">
      <nav className="mb-6 flex items-center space-x-2 text-xs font-label uppercase tracking-widest text-on-surface-variant">
        <Link to="/admin/customers" className="hover:text-primary transition-colors">
          Patrons
        </Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-primary font-bold truncate max-w-[40ch]">
          {data.FullName}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="bg-surface-container-highest rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                {data.AvatarUrl ? (
                  <img
                    src={data.AvatarUrl}
                    alt={data.FullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-headline text-primary text-xl">
                    {initials(data.FullName)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-headline font-bold text-on-surface">
                    {data.FullName}
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-outline">
                    @{data.Username}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                {data.Gender && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-outline">
                      Gender
                    </dt>
                    <dd className="text-on-surface">{data.Gender}</dd>
                  </div>
                )}
                {data.DateOfBirth && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-outline">
                      Date of Birth
                    </dt>
                    <dd className="text-on-surface">{data.DateOfBirth}</dd>
                  </div>
                )}
                {data.Email && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-outline">
                      Email
                    </dt>
                    <dd className="text-on-surface">
                      <a
                        href={`mailto:${data.Email}`}
                        className="hover:text-primary"
                      >
                        {data.Email}
                      </a>
                    </dd>
                  </div>
                )}
                {data.Phone && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-outline">
                      Phone
                    </dt>
                    <dd className="text-on-surface">
                      <a
                        href={`tel:${data.Phone}`}
                        className="hover:text-primary"
                      >
                        {data.Phone}
                      </a>
                    </dd>
                  </div>
                )}
                {data.Address && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-outline">
                      Address
                    </dt>
                    <dd className="text-on-surface whitespace-pre-line">
                      {data.Address}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container-high text-center">
                <p className="font-label uppercase tracking-widest text-[10px] text-outline mb-1">
                  Orders
                </p>
                <p className="text-3xl font-headline tabular-nums">
                  {data.order_count}
                </p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container-high text-center">
                <p className="font-label uppercase tracking-widest text-[10px] text-outline mb-1">
                  Lifetime
                </p>
                <p className="text-3xl font-headline tabular-nums">
                  {formatPrice(data.total_spend)}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <h2 className="text-2xl font-headline text-on-surface mb-4">
            Order Timeline
          </h2>
          {data.orders.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-3 block">
                receipt_long
              </span>
              <p className="font-headline italic text-lg text-on-surface">
                This patron has not placed any orders yet
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.orders.map((o) => (
                <li
                  key={o.OrderId}
                  className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-5 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        to={`/admin/orders/${o.OrderId}`}
                        className="font-headline text-on-surface hover:text-primary transition-colors"
                      >
                        Order #{o.OrderId}
                      </Link>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-label uppercase tracking-widest rounded-full ${
                          o.PaymentStatus
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-tertiary-container text-on-tertiary-container"
                        }`}
                      >
                        {o.PaymentStatus ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    <p className="text-[11px] uppercase tracking-widest text-outline mt-1">
                      Placed {o.OrderDate} &middot; delivers {o.DeliveryDate}
                      &middot; {o.item_count}{" "}
                      {o.item_count === 1 ? "stone" : "stones"}
                    </p>
                  </div>
                  <Link
                    to={`/admin/orders/${o.OrderId}`}
                    className="flex items-center gap-2"
                  >
                    <span className="text-lg font-headline font-bold text-primary tabular-nums">
                      {formatPrice(o.total)}
                    </span>
                    <span className="material-symbols-outlined text-base text-outline">
                      arrow_forward
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
