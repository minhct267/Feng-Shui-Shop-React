import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchAdminOrderDetail,
  updateOrderPaymentStatus,
} from "../../services/adminApi";
import ConfirmModal from "../../components/ConfirmModal";

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function deliveryBadge(deliveryDate) {
  if (!deliveryDate) return { label: "Unscheduled", tone: "neutral" };
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

export default function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pendingToggle, setPendingToggle] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");
  const [topBanner, setTopBanner] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminOrderDetail(orderId)
      .then((data) => !cancelled && setOrder(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function confirmTogglePayment() {
    if (!order) return;
    setToggling(true);
    setToggleError("");
    try {
      const next = await updateOrderPaymentStatus(order.OrderId, !order.PaymentStatus);
      setOrder(next);
      setPendingToggle(false);
      setTopBanner({
        type: "success",
        message: `Order #${order.OrderId} marked as ${next.PaymentStatus ? "paid" : "unpaid"}.`,
      });
    } catch (err) {
      setToggleError(err.message);
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-on-surface-variant font-label uppercase tracking-widest text-xs flex items-center justify-center gap-2">
        <span className="material-symbols-outlined animate-spin text-sm">
          progress_activity
        </span>
        Channeling order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-headline text-on-surface mb-4">
          Order not found
        </h1>
        <p className="text-on-surface-variant mb-8">
          {error || "This order has drifted out of the ledger."}
        </p>
        <button
          onClick={() => navigate("/admin/orders")}
          className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label uppercase tracking-widest text-xs"
        >
          Return to ledger
        </button>
      </div>
    );
  }

  const delivery = deliveryBadge(order.DeliveryDate);

  return (
    <div className="p-8 custom-scrollbar print:p-0">
      <nav className="mb-8 flex items-center space-x-2 text-xs font-label uppercase tracking-widest text-on-surface-variant print:hidden">
        <Link to="/admin/orders" className="hover:text-primary transition-colors">
          Order Ledger
        </Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-primary font-bold">Order #{order.OrderId}</span>
      </nav>

      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <span className="font-label uppercase tracking-widest text-xs text-outline block mb-2">
            Placed {order.OrderDate}
          </span>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
            Order #{order.OrderId}
          </h1>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full ${
                order.PaymentStatus ? TONE_CLASS.success : TONE_CLASS.warning
              }`}
            >
              {order.PaymentStatus ? "Paid" : "Unpaid"}
            </span>
            <span
              className={`px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full ${TONE_CLASS[delivery.tone]}`}
            >
              {delivery.label} &middot; {order.DeliveryDate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-outline-variant/40 hover:bg-surface-variant px-5 py-2.5 rounded-full font-label uppercase tracking-widest text-[10px] transition-colors"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print invoice
          </button>
          <button
            type="button"
            onClick={() => setPendingToggle(true)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label uppercase tracking-widest text-[10px] shadow transition-all ${
              order.PaymentStatus
                ? "bg-tertiary-container text-on-tertiary-container hover:opacity-90"
                : "bg-gradient-to-r from-primary to-primary-container text-on-primary hover:shadow-md"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {order.PaymentStatus ? "undo" : "check_circle"}
            </span>
            {order.PaymentStatus ? "Mark as unpaid" : "Mark as paid"}
          </button>
        </div>
      </div>

      {topBanner && (
        <div
          className={`mb-6 px-5 py-4 rounded-sm text-sm font-label flex items-start gap-3 ${
            topBanner.type === "success"
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-error-container text-on-error-container"
          }`}
        >
          <span className="material-symbols-outlined text-base">info</span>
          <span>{topBanner.message}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-grow">
          <h2 className="text-xl font-headline text-on-surface mb-4">
            Sacred Selection ({order.item_count}{" "}
            {order.item_count === 1 ? "stone" : "stones"})
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.ProductId}
                className="bg-surface-container-lowest p-5 flex items-center gap-5 rounded-lg"
              >
                <Link
                  to={`/admin/products/update/${item.ProductId}`}
                  className="w-20 h-24 flex-shrink-0 bg-surface-container overflow-hidden rounded"
                >
                  {item.ImageUrl ? (
                    <img
                      src={item.ImageUrl}
                      alt={item.ProductName}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                      <span className="material-symbols-outlined">image</span>
                    </div>
                  )}
                </Link>
                <div className="flex-grow min-w-0">
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary">
                    {item.CategoryName || "Uncategorized"}
                  </span>
                  <Link
                    to={`/admin/products/update/${item.ProductId}`}
                    className="block text-lg font-headline text-on-surface hover:text-primary transition-colors truncate"
                  >
                    {item.ProductName}
                  </Link>
                  <p className="text-sm text-on-surface-variant">
                    {formatPrice(item.UnitPrice)} &times; {item.Quantity}
                  </p>
                </div>
                <span className="text-lg font-headline font-bold text-primary tabular-nums whitespace-nowrap">
                  {formatPrice(item.LineTotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-highest p-6 rounded-lg">
              <h3 className="font-label uppercase tracking-widest text-[10px] text-outline mb-3">
                Customer
              </h3>
              <p className="font-headline text-lg text-on-surface mb-1">
                {order.customer.FullName}
              </p>
              {order.customer.Gender && (
                <p className="text-[10px] uppercase tracking-widest text-outline mb-3">
                  {order.customer.Gender}
                </p>
              )}
              {order.customer.Email && (
                <p className="text-sm text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">
                    mail
                  </span>
                  <a
                    href={`mailto:${order.customer.Email}`}
                    className="hover:text-primary"
                  >
                    {order.customer.Email}
                  </a>
                </p>
              )}
              {order.customer.Phone && (
                <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-sm text-primary">
                    call
                  </span>
                  <a
                    href={`tel:${order.customer.Phone}`}
                    className="hover:text-primary"
                  >
                    {order.customer.Phone}
                  </a>
                </p>
              )}
              <Link
                to={`/admin/customers/${order.customer.CustomerId}`}
                className="mt-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary font-bold hover:underline print:hidden"
              >
                View patron profile
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>

            <div className="bg-surface-container-highest p-6 rounded-lg">
              <h3 className="font-label uppercase tracking-widest text-[10px] text-outline mb-3">
                Delivery & Payment
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-outline mb-1">
                Delivery address
              </p>
              <p className="text-sm text-on-surface mb-4">
                {order.DeliveryAddress}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-outline mb-1">
                Delivery date
              </p>
              <p className="text-sm text-on-surface mb-4">
                {order.DeliveryDate}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-outline mb-1">
                Payment method
              </p>
              <p className="text-sm text-on-surface">
                {order.PaymentMethodName || "—"}
              </p>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-[360px] shrink-0">
          <div className="lg:sticky lg:top-32 bg-surface-container-highest p-8 rounded-lg space-y-5">
            <h2 className="text-2xl font-headline font-bold text-primary">
              Sacred Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Subtotal
                </span>
                <span className="font-bold tabular-nums">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Shipping
                </span>
                <span className="font-bold tabular-nums">
                  {formatPrice(order.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Tax (8%)
                </span>
                <span className="font-bold tabular-nums">
                  {formatPrice(order.tax_amount)}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-end">
              <span className="font-headline text-lg italic text-primary">
                Total
              </span>
              <span className="text-3xl font-headline font-bold text-on-surface tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={pendingToggle}
        title={
          order.PaymentStatus
            ? "Mark this order as unpaid?"
            : "Mark this order as paid?"
        }
        confirmLabel={order.PaymentStatus ? "Mark unpaid" : "Mark paid"}
        cancelLabel="Cancel"
        variant={order.PaymentStatus ? "destructive" : undefined}
        loading={toggling}
        loadingMessage="Updating..."
        error={toggleError}
        onCancel={() => !toggling && setPendingToggle(false)}
        onConfirm={confirmTogglePayment}
      >
        <p className="text-on-surface-variant text-sm">
          {order.PaymentStatus
            ? `Order #${order.OrderId} will be moved back to the unpaid ledger.`
            : `Order #${order.OrderId} will be marked as fully paid (${formatPrice(order.total)}).`}
        </p>
      </ConfirmModal>
    </div>
  );
}
