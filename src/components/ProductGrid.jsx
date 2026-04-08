import { useEffect, useState } from "react";
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
    <section className="product-section">
      <div className="section-header">
        <div>
          <h2>Artifacts</h2>
          <p>Stones of origin, hand-picked for vibrational purity.</p>
        </div>
        <div className="sort-control">
          <span>Sort by</span>
          <span className="sort-label-active">Newest</span>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            expand_more
          </span>
        </div>
      </div>

      {loading && (
        <div className="loading-state">Loading artifacts...</div>
      )}

      {error && (
        <div className="error-state">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.ProductId}
                product={product}
                staggered={index % 3 === 1}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="page-btn-nav"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>
                  chevron_left
                </span>
              </button>

              {getPageNumbers()[0] > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="page-btn"
                  >
                    1
                  </button>
                  {getPageNumbers()[0] > 2 && (
                    <span className="page-ellipsis">...</span>
                  )}
                </>
              )}

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`page-btn${p === page ? " page-btn-active" : ""}`}
                >
                  {p}
                </button>
              ))}

              {getPageNumbers().at(-1) < totalPages && (
                <>
                  {getPageNumbers().at(-1) < totalPages - 1 && (
                    <span className="page-ellipsis">...</span>
                  )}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="page-btn"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="page-btn-nav"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>
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
