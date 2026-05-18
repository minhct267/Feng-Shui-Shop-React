import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { fetchProductDetail } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function formatPrice(value) {
  if (value == null) return "";
  return `$${Number(value).toFixed(2)}`;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    setActiveImage(0);
    setQuantity(1);
    setFeedback(null);

    fetchProductDetail(productId)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const stock = product?.Quantity ?? 0;
  const outOfStock = stock <= 0;

  useEffect(() => {
    if (quantity > stock && stock > 0) setQuantity(stock);
    if (quantity < 1) setQuantity(1);
  }, [quantity, stock]);

  const heroImage = useMemo(() => {
    if (!product?.Images?.length) return null;
    return product.Images[activeImage] ?? product.Images[0];
  }, [product, activeImage]);

  function adjustQty(delta) {
    setQuantity((q) => {
      const next = q + delta;
      if (next < 1) return 1;
      if (next > stock) return stock;
      return next;
    });
  }

  async function handleAddToCart() {
    if (outOfStock || adding) return;
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (user.role === "admin") {
      navigate(`/admin/products/update/${product.ProductId}`);
      return;
    }
    setAdding(true);
    setFeedback(null);
    try {
      await addItem(product.ProductId, quantity);
      setFeedback({
        type: "success",
        message: `${quantity} × ${product.ProductName} added to your sanctuary.`,
      });
      setTimeout(() => navigate("/"), 700);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-24 text-center text-on-surface-variant font-label uppercase tracking-widest text-xs">
        Channeling artifact details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-24 text-center">
        <h1 className="text-3xl font-headline text-on-surface mb-4">
          Artifact not found
        </h1>
        <p className="text-on-surface-variant mb-8">
          {error || "This sacred artifact has drifted out of our collection."}
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label uppercase tracking-widest text-xs"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const showOldPrice = product.OldPrice != null && product.OldPrice > (product.Price ?? 0);
  const promotionActive = product.PromotionActive && product.PromotionName;
  const lowStock = stock > 0 && stock <= 5;

  const images = product.Images ?? [];
  const thumbs = images.slice(0, 3);
  const remainingThumbs = Math.max(images.length - 3, 0);

  return (
    <article className="pb-24">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-8 pt-12 mb-12">
        <nav className="flex items-center space-x-2 text-xs font-label uppercase tracking-widest text-on-surface-variant">
          <Link to="/" className="hover:text-primary transition-colors">
            Sacred Artifacts
          </Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="hover:text-primary transition-colors">
            {product.CategoryName}
          </span>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-primary font-bold truncate max-w-[40ch]">
            {product.ProductName}
          </span>
        </nav>
      </div>

      <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Left: gallery */}
        <div className="lg:col-span-7 space-y-8">
          <div className="relative bg-surface-container-lowest rounded-lg overflow-hidden aspect-[4/5] shadow-sm">
            {heroImage?.ImageUrl ? (
              <img
                className="w-full h-full object-cover"
                alt={heroImage.ImageDescription || product.ProductName}
                src={heroImage.ImageUrl}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                No Image
              </div>
            )}
            <div className="absolute bottom-8 left-8 bg-surface/90 backdrop-blur-md px-6 py-4 rounded-sm border-l-4 border-secondary max-w-[80%]">
              <p className="text-xs font-label uppercase tracking-[0.2em] text-secondary mb-1">
                {product.CategoryName}
              </p>
              <p className="font-headline italic text-on-surface">
                {product.ShortDescription || "Curated for elemental balance"}
              </p>
            </div>
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-4 h-48">
              {thumbs.map((img, idx) => (
                <button
                  type="button"
                  key={img.ImageId}
                  onClick={() => setActiveImage(idx)}
                  className={`bg-surface-container-lowest rounded-sm overflow-hidden transition-all ${
                    idx === activeImage
                      ? "ring-2 ring-primary"
                      : "hover:opacity-80"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    className="w-full h-full object-cover"
                    alt={img.ImageDescription || `${product.ProductName} angle ${idx + 1}`}
                    src={img.ImageUrl}
                  />
                </button>
              ))}
              {remainingThumbs > 0 && (
                <div className="bg-surface-container-lowest rounded-sm overflow-hidden flex items-center justify-center p-4 text-center border border-outline-variant/20">
                  <p className="text-xs font-label uppercase text-outline">
                    + {remainingThumbs} more {remainingThumbs === 1 ? "angle" : "angles"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="lg:col-span-5 lg:sticky lg:top-32">
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-label uppercase tracking-widest rounded-full">
                {product.CategoryName}
              </span>
              {promotionActive && (
                <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-label uppercase tracking-widest rounded-full">
                  {product.PromotionName}
                </span>
              )}
              {lowStock && (
                <span className="px-3 py-1 bg-error-container text-on-error-container text-[10px] font-label uppercase tracking-widest rounded-full">
                  Only {stock} left
                </span>
              )}
              {outOfStock && (
                <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-label uppercase tracking-widest rounded-full">
                  Out of Stock
                </span>
              )}
            </div>
            <h1 className="text-5xl font-headline font-bold text-on-surface tracking-tight mb-4">
              {product.ProductName}
            </h1>
            <div className="flex items-baseline space-x-4">
              <span className="text-3xl font-headline text-primary">
                {formatPrice(product.Price)}
              </span>
              {showOldPrice && (
                <span className="text-sm text-outline line-through">
                  {formatPrice(product.OldPrice)}
                </span>
              )}
            </div>
          </header>

          {/* Quantity selector */}
          {!outOfStock && (
            <div className="mb-8">
              <p className="font-label uppercase tracking-[0.15em] text-xs font-bold mb-3 text-outline">
                Quantity
              </p>
              <div className="flex items-center gap-6">
                <div className="inline-flex items-center border border-outline-variant/40 rounded-full">
                  <button
                    type="button"
                    onClick={() => adjustQty(-1)}
                    disabled={quantity <= 1}
                    className="p-3 hover:text-primary transition-colors disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="px-6 font-body text-sm font-bold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustQty(1)}
                    disabled={quantity >= stock}
                    className="p-3 hover:text-primary transition-colors disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <span className="font-label uppercase tracking-widest text-[10px] text-outline">
                  {stock} available
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4 mb-12">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-5 px-8 font-label uppercase tracking-widest text-sm font-bold shadow-lg hover:opacity-90 transition-all flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {outOfStock
                  ? "Out of Stock"
                  : adding
                  ? "Adding to Sanctuary..."
                  : user?.role === "admin"
                  ? "Edit This Artifact"
                  : "Add to Your Sanctuary"}
              </span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>

            {!user && (
              <p className="text-[11px] text-center text-on-surface-variant font-label tracking-wider">
                You will be asked to sign in to add this stone to your basket.
              </p>
            )}

            {feedback && (
              <div
                className={`px-4 py-3 rounded-sm text-sm font-label ${
                  feedback.type === "success"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-error-container text-on-error-container"
                }`}
              >
                {feedback.message}
              </div>
            )}
          </div>

          {/* Promotion call-out */}
          {promotionActive && product.PromotionDetails && (
            <div className="border-t border-outline-variant/30 pt-8 mb-8">
              <h3 className="font-label uppercase tracking-[0.15em] text-xs font-bold mb-3 flex items-center text-primary">
                <span className="material-symbols-outlined mr-2 text-sm">
                  redeem
                </span>
                Active Promotion
              </h3>
              <div className="p-4 bg-surface-container-highest/50 rounded-sm">
                <h4 className="text-sm font-bold mb-1">{product.PromotionName}</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {product.PromotionDetails}
                </p>
                {product.PromotionEndDate && (
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-outline">
                    Ends {product.PromotionEndDate}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Storytelling section: detailed description */}
      {product.DetailedDescription && (
        <section className="mt-24 bg-surface-container-highest/30 py-24">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <span className="text-primary material-symbols-outlined text-4xl mb-6 block">
              spa
            </span>
            <h2 className="text-4xl font-headline italic mb-8">
              The Essence of {product.ProductName}
            </h2>
            <div className="space-y-6 text-lg text-on-surface-variant font-light leading-relaxed italic">
              <p>{product.DetailedDescription}</p>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
