import { useState, useEffect } from "react";
import { fetchProducts } from "../services/api";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <section className="flex-1">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h2 className="text-4xl font-headline text-on-surface mb-2">
            Curated Artifacts
          </h2>
          <p className="text-on-surface-variant">
            Stones of origin, hand-picked for vibrational purity.
          </p>
        </div>
        <div className="flex items-center space-x-4 border-b border-outline-variant/40 pb-2">
          <span className="font-label text-[10px] uppercase tracking-widest">
            Sort by
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
            Vibration
          </span>
          <span className="material-symbols-outlined text-sm">expand_more</span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 text-on-surface-variant">
          Loading artifacts...
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-20">
          {products.map((product, index) => (
            <ProductCard
              key={product.ProductId}
              product={product}
              staggered={index % 3 === 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
