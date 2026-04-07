import { useState, useEffect } from "react";
import { fetchProducts } from "../services/api";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 30;

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProducts(page, PAGE_SIZE)
      .then((data) => {
        setProducts(data.items);
        setTotalPages(Math.ceil(data.total / PAGE_SIZE));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  function getPageNumbers() {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

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
            Newest
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
        <div className="text-center py-20 text-error">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-20">
            {products.map((product, index) => (
              <ProductCard
                key={product.ProductId}
                product={product}
                staggered={index % 3 === 1}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center items-center gap-2 mt-20">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-md text-sm font-label tracking-wider uppercase
                           border border-outline-variant/40 text-on-surface
                           hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed
                           transition-colors"
              >
                <span className="material-symbols-outlined text-base align-middle">
                  chevron_left
                </span>
              </button>

              {getPageNumbers()[0] > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="w-10 h-10 rounded-md text-sm font-label border border-outline-variant/40
                               text-on-surface hover:bg-surface-variant transition-colors"
                  >
                    1
                  </button>
                  {getPageNumbers()[0] > 2 && (
                    <span className="text-on-surface-variant px-1">...</span>
                  )}
                </>
              )}

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-md text-sm font-label transition-colors
                    ${
                      p === page
                        ? "bg-primary text-on-primary font-bold"
                        : "border border-outline-variant/40 text-on-surface hover:bg-surface-variant"
                    }`}
                >
                  {p}
                </button>
              ))}

              {getPageNumbers().at(-1) < totalPages && (
                <>
                  {getPageNumbers().at(-1) < totalPages - 1 && (
                    <span className="text-on-surface-variant px-1">...</span>
                  )}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="w-10 h-10 rounded-md text-sm font-label border border-outline-variant/40
                               text-on-surface hover:bg-surface-variant transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-md text-sm font-label tracking-wider uppercase
                           border border-outline-variant/40 text-on-surface
                           hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed
                           transition-colors"
              >
                <span className="material-symbols-outlined text-base align-middle">
                  chevron_right
                </span>
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
