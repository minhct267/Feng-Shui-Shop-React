import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchPaymentMethods } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function isoDateAfter(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, count, loading, error, setItemQty, removeItem, refresh, checkout } = useCart();
  const navigate = useNavigate();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pmLoading, setPmLoading] = useState(true);
  const [pmError, setPmError] = useState(null);

  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(isoDateAfter(5));

  const [actionState, setActionState] = useState({});  // { [productId]: 'updating' | 'removing' }
  const [topBanner, setTopBanner] = useState(null);    // { type, message }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [pendingRemove, setPendingRemove] = useState(null); // line item
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const [orderConfirmation, setOrderConfirmation] = useState(null);

  const minDeliveryDate = useMemo(() => isoDateAfter(0), []);

  // Auth guards
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true, state: { from: "/cart" } });
    } else if (user.role === "admin") {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Auto-dismiss the success modal and head home
  useEffect(() => {
    if (!orderConfirmation) return;
    const timer = setTimeout(() => {
      setOrderConfirmation(null);
      navigate("/", { replace: true });
    }, 2800);
    return () => clearTimeout(timer);
  }, [orderConfirmation, navigate]);

  // Prefill delivery address when user becomes available
  useEffect(() => {
    if (user?.address && !deliveryAddress) {
      setDeliveryAddress(user.address);
    }
  }, [user, deliveryAddress]);

  // Load payment methods once
  useEffect(() => {
    let cancelled = false;
    setPmLoading(true);
    fetchPaymentMethods()
      .then((data) => {
        if (cancelled) return;
        setPaymentMethods(data);
        if (data.length > 0) setPaymentMethodId(String(data[0].PaymentMethodId));
      })
      .catch((err) => !cancelled && setPmError(err.message))
      .finally(() => !cancelled && setPmLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (authLoading || !user || user.role === "admin") return null;

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  async function handleQtyChange(item, nextQty) {
    if (nextQty < 1 || nextQty === item.Quantity) return;
    if (nextQty > item.StockAvailable) {
      setTopBanner({
        type: "error",
        message: `Only ${item.StockAvailable} of ${item.ProductName} are available.`,
      });
      return;
    }
    setActionState((s) => ({ ...s, [item.ProductId]: "updating" }));
    try {
      await setItemQty(item.ProductId, nextQty);
      setTopBanner(null);
    } catch (err) {
      setTopBanner({ type: "error", message: err.message });
    } finally {
      setActionState((s) => {
        const { [item.ProductId]: _ignored, ...rest } = s;
        return rest;
      });
    }
  }

  function askRemove(item) {
    setRemoveError("");
    setPendingRemove(item);
  }

  async function confirmRemove() {
    if (!pendingRemove) return;
    setRemoving(true);
    setRemoveError("");
    try {
      await removeItem(pendingRemove.ProductId);
      setPendingRemove(null);
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemoving(false);
    }
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setSubmitError("");
    if (isEmpty) {
      setSubmitError("Your basket is empty.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setSubmitError("Please provide a delivery address.");
      return;
    }
    if (!deliveryDate) {
      setSubmitError("Please choose a delivery date.");
      return;
    }
    if (deliveryDate < minDeliveryDate) {
      setSubmitError("Delivery date cannot be in the past.");
      return;
    }
    if (!paymentMethodId) {
      setSubmitError("Please select a payment method.");
      return;
    }
    if (cart?.has_stock_issue) {
      setSubmitError("Please adjust the quantities of items above the available stock first.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await checkout({
        delivery_address: deliveryAddress.trim(),
        delivery_date: deliveryDate,
        payment_method_id: Number(paymentMethodId),
      });
      setOrderConfirmation(result);
    } catch (err) {
      if (err.status === 409) {
        setTopBanner({ type: "error", message: err.message });
        await refresh();
      } else {
        setSubmitError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="px-8 max-w-screen-2xl mx-auto pt-12 pb-24 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Cart items */}
        <div className="flex-grow space-y-12">
          <div className="flex items-baseline justify-between">
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
              Your Sacred Selection
            </h1>
            <span className="font-label text-xs uppercase tracking-widest text-outline">
              {count} {count === 1 ? "Element" : "Elements"} in Cart
            </span>
          </div>

          {topBanner && (
            <div
              className={`px-5 py-4 rounded-sm text-sm font-label flex items-start gap-3 ${
                topBanner.type === "error"
                  ? "bg-error-container text-on-error-container"
                  : "bg-secondary-container text-on-secondary-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">info</span>
              <span>{topBanner.message}</span>
            </div>
          )}

          {error && (
            <div className="px-5 py-4 rounded-sm text-sm bg-error-container text-on-error-container">
              {error}
            </div>
          )}

          {loading && isEmpty && (
            <div className="text-center py-20 text-on-surface-variant font-label uppercase tracking-widest text-xs">
              Awakening your basket...
            </div>
          )}

          {!loading && isEmpty && (
            <div className="bg-surface-container-lowest p-16 text-center rounded-sm">
              <span className="material-symbols-outlined text-5xl text-outline mb-4 block">
                shopping_basket
              </span>
              <h2 className="text-2xl font-headline italic text-on-surface mb-2">
                Your basket is still empty
              </h2>
              <p className="text-sm text-on-surface-variant mb-8 max-w-md mx-auto">
                Curate stones from our collection to begin building your sacred
                selection.
              </p>
              <Link
                to="/"
                className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label uppercase tracking-widest text-xs"
              >
                Continue Browsing
              </Link>
            </div>
          )}

          {!isEmpty && (
            <div className="space-y-8">
              {items.map((item) => {
                const exceedsStock = item.Quantity > item.StockAvailable;
                const isBusy = !!actionState[item.ProductId];
                return (
                  <div
                    key={item.ProductId}
                    className="bg-surface-container-lowest p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start group transition-all duration-300 hover:bg-surface-container-high"
                  >
                    <Link
                      to={`/products/${item.ProductId}`}
                      className="w-32 h-40 flex-shrink-0 bg-surface-container overflow-hidden"
                    >
                      {item.ImageUrl ? (
                        <img
                          className="w-full h-full object-cover"
                          alt={item.ProductName}
                          src={item.ImageUrl}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs">
                          No Image
                        </div>
                      )}
                    </Link>
                    <div className="flex-grow space-y-2 w-full">
                      <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary">
                        {item.CategoryName}
                      </span>
                      <Link
                        to={`/products/${item.ProductId}`}
                        className="block text-xl font-headline text-on-surface hover:text-primary transition-colors"
                      >
                        {item.ProductName}
                      </Link>
                      <p className="text-sm text-on-surface-variant">
                        {formatPrice(item.UnitPrice)} per stone
                        {item.OldPrice && item.OldPrice > item.UnitPrice && (
                          <span className="ml-2 line-through text-outline">
                            {formatPrice(item.OldPrice)}
                          </span>
                        )}
                      </p>

                      {exceedsStock && (
                        <p className="text-xs text-tertiary font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            warning
                          </span>
                          Only {item.StockAvailable} left in stock — please adjust before checkout.
                        </p>
                      )}

                      <div className="pt-4 flex items-center gap-8 flex-wrap">
                        <div className="flex items-center border-b border-outline-variant/40 pb-1">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item, item.Quantity - 1)}
                            disabled={item.Quantity <= 1 || isBusy}
                            className="p-1 hover:text-primary transition-colors disabled:opacity-30"
                            aria-label="Decrease quantity"
                          >
                            <span className="material-symbols-outlined text-sm">
                              remove
                            </span>
                          </button>
                          <span className="px-4 font-body text-sm font-bold tabular-nums">
                            {item.Quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item, item.Quantity + 1)}
                            disabled={item.Quantity >= item.StockAvailable || isBusy}
                            className="p-1 hover:text-primary transition-colors disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <span className="material-symbols-outlined text-sm">
                              add
                            </span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => askRemove(item)}
                          disabled={isBusy}
                          className="flex items-center gap-1 text-xs uppercase tracking-widest text-outline hover:text-tertiary transition-colors disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                          Remove
                        </button>
                        {isBusy && (
                          <span className="text-[10px] uppercase tracking-widest text-outline">
                            Updating...
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right w-full md:w-auto">
                      <span className="text-xl font-headline font-bold text-primary">
                        {formatPrice(item.LineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary aside */}
        <aside className="w-full lg:w-[420px] shrink-0">
          <div className="sticky top-32 bg-surface-container-highest p-8 lg:p-10 space-y-6">
            <h2 className="text-2xl font-headline font-bold text-primary">
              Sacred Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant font-body">
                  Ritual Items Subtotal
                </span>
                <span className="text-on-surface font-bold">
                  {formatPrice(cart?.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant font-body">
                  Spiritual Care &amp; Shipping
                </span>
                <span className="text-on-surface font-bold">
                  {formatPrice(cart?.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant font-body">
                  Estimated Elements Tax (8%)
                </span>
                <span className="text-on-surface font-bold">
                  {formatPrice(cart?.tax_amount)}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/30 flex justify-between items-end">
              <span className="font-headline text-lg italic text-primary">
                Total Investment
              </span>
              <span className="text-3xl font-headline font-bold text-on-surface">
                {formatPrice(cart?.total)}
              </span>
            </div>

            {/* Delivery form */}
            <form className="space-y-5 pt-6 border-t border-outline-variant/30" onSubmit={handleCheckout}>
              <div>
                <label
                  htmlFor="delivery_address"
                  className="font-label uppercase tracking-widest text-[10px] text-outline block mb-2"
                >
                  Delivery Address
                </label>
                <textarea
                  id="delivery_address"
                  rows={3}
                  className="form-underline w-full py-2 px-0 text-sm text-on-surface placeholder:text-outline-variant/60 resize-none"
                  placeholder="Where shall we send your stones?"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="delivery_date"
                    className="font-label uppercase tracking-widest text-[10px] text-outline block mb-2"
                  >
                    Delivery Date
                  </label>
                  <input
                    id="delivery_date"
                    type="date"
                    min={minDeliveryDate}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="form-underline w-full py-2 px-0 text-sm text-on-surface"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="payment_method"
                    className="font-label uppercase tracking-widest text-[10px] text-outline block mb-2"
                  >
                    Payment Method
                  </label>
                  <select
                    id="payment_method"
                    className="form-underline w-full py-2 px-0 text-sm text-on-surface bg-transparent"
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    disabled={pmLoading || paymentMethods.length === 0}
                    required
                  >
                    {pmLoading && <option value="">Loading...</option>}
                    {!pmLoading && paymentMethods.length === 0 && (
                      <option value="">No methods available</option>
                    )}
                    {!pmLoading &&
                      paymentMethods.map((pm) => (
                        <option key={pm.PaymentMethodId} value={pm.PaymentMethodId}>
                          {pm.MethodName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {pmError && (
                <p className="text-xs text-error">{pmError}</p>
              )}

              {submitError && (
                <div className="bg-error-container text-on-error-container px-4 py-3 rounded-sm text-sm font-label">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || isEmpty}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-5 font-label uppercase tracking-widest font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">
                      progress_activity
                    </span>
                    Processing Order...
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </button>
              <p className="text-[10px] text-center text-outline-variant font-label tracking-wider uppercase">
                Secure spiritual encryption enabled
              </p>
            </form>

            <div className="pt-6 border-t border-outline-variant/30">
              <div className="flex gap-4 items-center bg-surface/50 p-4 rounded-sm">
                <span className="material-symbols-outlined text-primary">
                  auto_awesome
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface">
                    Curator&apos;s Note
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Your elements will be cleansed with white sage before
                    shipping to ensure pure intent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Remove item confirmation */}
      <ConfirmModal
        open={!!pendingRemove}
        title="Release this artifact?"
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="destructive"
        loading={removing}
        loadingMessage="Removing..."
        error={removeError}
        onCancel={() => !removing && setPendingRemove(null)}
        onConfirm={confirmRemove}
      >
        <p className="text-on-surface-variant text-sm">
          Are you sure you want to remove
          {pendingRemove ? (
            <span className="font-bold text-on-surface"> {pendingRemove.ProductName} </span>
          ) : (
            " this stone "
          )}
          from your sacred selection?
        </p>
      </ConfirmModal>

      {/* Checkout success modal (auto-dismisses) */}
      <ConfirmModal
        open={!!orderConfirmation}
        success
        successMessage={
          orderConfirmation
            ? `Order #${orderConfirmation.order_id} placed`
            : "Order placed"
        }
        successSubMessage={
          orderConfirmation
            ? `Your stones are being prepared via ${orderConfirmation.payment_method}. Total ${formatPrice(orderConfirmation.total)}, expected by ${orderConfirmation.delivery_date}.`
            : ""
        }
      />
    </article>
  );
}
