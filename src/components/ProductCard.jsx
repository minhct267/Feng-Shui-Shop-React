import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProductCard({ product, staggered }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const imageUrl = product.ImageUrl
    ?? (product.ImageName ? `/products/${product.ImageName}` : null);

  const priceDisplay = product.Price != null
    ? `$${product.Price.toFixed(0)}`
    : "";

  function handleInvokePresence() {
    if (user?.role === "admin") {
      navigate(`/admin/products/update/${product.ProductId}`);
    } else {
      navigate(`/products/${product.ProductId}`);
    }
  }

  return (
    <div className={`group ${staggered ? "mt-12" : ""}`}>
      <div
        className="aspect-[4/5] bg-surface-container-lowest overflow-hidden mb-6 cursor-pointer"
        onClick={handleInvokePresence}
      >
        {imageUrl ? (
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            alt={product.ProductName}
            src={imageUrl}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            No Image
          </div>
        )}
      </div>
      <div className="flex justify-between items-start">
        <div>
          <span className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-1 block">
            {product.CategoryName}
          </span>
          <h3 className="font-headline text-xl text-on-surface mb-1">
            {product.ProductName}
          </h3>
          <p className="text-on-surface-variant text-sm font-light italic">
            {product.ShortDescription}
          </p>
        </div>
        <span className="font-headline text-lg text-primary">{priceDisplay}</span>
      </div>
      <button
        type="button"
        onClick={handleInvokePresence}
        className="mt-4 w-full py-3 border border-outline-variant/20 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 font-label uppercase tracking-widest text-[10px]"
      >
        {user?.role === "admin" ? "Edit Product" : "Invoke Presence"}
      </button>
    </div>
  );
}
