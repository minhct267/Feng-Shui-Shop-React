export default function ProductCard({ product, staggered }) {
  const imageUrl = product.ImageUrl
    ?? (product.ImageName ? `/products/${product.ImageName}` : null);

  const priceDisplay = product.Price != null
    ? `$${product.Price.toFixed(0)}`
    : "";

  return (
    <article className={`product-card${staggered ? " staggered" : ""}`}>
      <div className="product-img-wrapper">
        {imageUrl ? (
          <img
            alt={product.ProductName}
            src={imageUrl}
          />
        ) : (
          <div className="no-image-placeholder">
            No Image
          </div>
        )}
      </div>
      <div className="product-info">
        <div>
          <span className="element-label">
            {product.CategoryName}
          </span>
          <h3 className="product-name">
            {product.ProductName}
          </h3>
          <p className="product-desc">
            {product.ShortDescription}
          </p>
        </div>
        <span className="product-price">{priceDisplay}</span>
      </div>
      <button className="btn-invoke">
        Invoke Presence
      </button>
    </article>
  );
}
