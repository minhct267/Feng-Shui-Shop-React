import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminProducts,
  fetchAdminProductDetail,
  deleteProduct,
} from "../services/api";
import ConfirmModal from "./ConfirmModal";

const PAGE_SIZE = 10;

export default function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mainImageIdx, setMainImageIdx] = useState(0);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const searchTimerRef = useRef(null);
  const previewRef = useRef(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProducts(search, page, PAGE_SIZE);
      setProducts(data.items);
      setTotal(data.total);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
      setSelectedId(null);
      setDetail(null);
    }, 400);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setMainImageIdx(0);
    fetchAdminProductDetail(selectedId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (detail && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [detail]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleRowClick(productId) {
    setSelectedId((prev) => (prev === productId ? null : productId));
  }

  function handleDelete() {
    setDeleteError("");
    setDeleteModal(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteProduct(selectedId);
      setDeleteSuccess(true);
      setTimeout(() => {
        setDeleteModal(false);
        setDeleteSuccess(false);
        setSelectedId(null);
        setDetail(null);
        loadProducts();
      }, 1200);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  function cancelDelete() {
    if (deleting) return;
    setDeleteModal(false);
    setDeleteError("");
  }

  return (
    <div className="p-8 custom-scrollbar">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-headline text-on-surface mb-2">
            Manage Products
          </h1>
          <p className="text-on-surface-variant font-light max-w-md">
            Curate the sanctuary's collection. Monitor inventory levels and
            maintain the spiritual integrity of each listing.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-transparent border-b border-outline-variant/40 focus:border-primary focus:ring-0 text-sm font-light transition-all outline-none"
              placeholder="Search the collection..."
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container-high">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Product Name
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Category
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline text-right">
                Price
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline text-right">
                Quantity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container animate-pulse" />
                      <div className="h-4 w-32 rounded bg-surface-container animate-pulse" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 rounded bg-surface-container animate-pulse" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 w-16 rounded bg-surface-container animate-pulse ml-auto" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 w-10 rounded bg-surface-container animate-pulse ml-auto" />
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">
                    inventory_2
                  </span>
                  <p className="text-sm font-light">
                    {search
                      ? "No products match your search."
                      : "No products in the collection yet."}
                  </p>
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isSelected = selectedId === p.ProductId;
                return (
                  <tr
                    key={p.ProductId}
                    onClick={() => handleRowClick(p.ProductId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/5 border-l-4 border-primary"
                        : "hover:bg-surface-container-low border-l-4 border-transparent"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
                          {p.ImageUrl ? (
                            <img
                              alt={p.ProductName}
                              className="w-full h-full object-cover"
                              src={p.ImageUrl}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                              <span className="material-symbols-outlined text-lg">
                                image
                              </span>
                            </div>
                          )}
                        </div>
                        <span
                          className={`font-headline truncate ${
                            isSelected
                              ? "text-amber-900 font-semibold"
                              : "text-on-surface"
                          }`}
                        >
                          {p.ProductName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] tracking-widest uppercase rounded-full">
                        {p.CategoryName}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-headline font-bold ${
                        isSelected ? "text-amber-900" : "text-on-surface"
                      }`}
                    >
                      {p.Price != null ? `$${p.Price.toFixed(2)}` : "--"}
                    </td>
                    <td className="px-6 py-4 text-right font-label text-on-surface-variant">
                      {p.Quantity}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant font-light">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total} products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                setSelectedId(null);
                setDetail(null);
              }}
              disabled={page <= 1}
              className="px-4 py-2 text-xs tracking-widest uppercase font-bold text-on-surface-variant hover:text-on-surface border border-outline-variant/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-xs text-on-surface-variant px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                setSelectedId(null);
                setDetail(null);
              }}
              disabled={page >= totalPages}
              className="px-4 py-2 text-xs tracking-widest uppercase font-bold text-on-surface-variant hover:text-on-surface border border-outline-variant/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Preview */}
      {selectedId && (
        <div
          ref={previewRef}
          className="mt-8 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high overflow-hidden animate-[fadeIn_0.25s_ease-out]"
        >
          {detailLoading ? (
            <div className="p-12 flex items-center justify-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-primary">
                progress_activity
              </span>
              <span className="text-sm">Loading product details...</span>
            </div>
          ) : detail ? (
            <div className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Image Gallery */}
                <div className="lg:w-[360px] flex-shrink-0">
                  <div className="aspect-[4/5] w-full rounded-xl overflow-hidden shadow-lg bg-surface-container">
                    {detail.Images.length > 0 ? (
                      <img
                        alt={detail.ProductName}
                        className="w-full h-full object-cover"
                        src={detail.Images[mainImageIdx]?.ImageUrl}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/30">
                        <span className="material-symbols-outlined text-5xl mb-2">
                          image
                        </span>
                        <span className="text-xs">No Images</span>
                      </div>
                    )}
                  </div>
                  {detail.Images.length > 1 && (
                    <div className="flex gap-2 mt-4 justify-center flex-wrap">
                      {detail.Images.map((img, idx) => (
                        <button
                          key={img.ImageId}
                          onClick={() => setMainImageIdx(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === mainImageIdx
                              ? "border-primary shadow-md"
                              : "border-transparent hover:border-outline-variant"
                          }`}
                        >
                          <img
                            alt={img.ImageDescription || `Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                            src={img.ImageUrl}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                    <div>
                      <h2 className="text-3xl font-headline text-on-surface">
                        {detail.ProductName}
                      </h2>
                      <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-primary mt-2 block">
                        {detail.CategoryName}
                        {detail.PromotionName && ` \u2022 ${detail.PromotionName}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-headline font-bold text-amber-900">
                        {detail.Price != null
                          ? `$${detail.Price.toFixed(2)}`
                          : "--"}
                      </span>
                      {detail.OldPrice != null && (
                        <span className="block text-sm text-on-surface-variant line-through mt-1">
                          ${detail.OldPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                        <span className="material-symbols-outlined text-primary text-xl block mb-2">
                          inventory
                        </span>
                        <h4 className="text-[11px] uppercase font-bold tracking-wider mb-1">
                          Stock
                        </h4>
                        <p className="text-sm text-on-surface font-semibold">
                          {detail.Quantity} units
                        </p>
                      </div>
                      <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                        <span className="material-symbols-outlined text-primary text-xl block mb-2">
                          category
                        </span>
                        <h4 className="text-[11px] uppercase font-bold tracking-wider mb-1">
                          Category
                        </h4>
                        <p className="text-sm text-on-surface font-semibold">
                          {detail.CategoryName}
                        </p>
                      </div>
                      {detail.UpdatedDate && (
                        <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                          <span className="material-symbols-outlined text-primary text-xl block mb-2">
                            calendar_today
                          </span>
                          <h4 className="text-[11px] uppercase font-bold tracking-wider mb-1">
                            Updated
                          </h4>
                          <p className="text-sm text-on-surface font-semibold">
                            {detail.UpdatedDate}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Short Description */}
                    {detail.ShortDescription && (
                      <section>
                        <h3 className="text-xs tracking-widest uppercase font-extrabold text-on-surface mb-3 pb-2 border-b border-outline-variant/20">
                          Short Description
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed font-light italic">
                          {detail.ShortDescription}
                        </p>
                      </section>
                    )}

                    {/* Detailed Description */}
                    {detail.DetailedDescription && (
                      <section>
                        <h3 className="text-xs tracking-widest uppercase font-extrabold text-on-surface mb-3 pb-2 border-b border-outline-variant/20">
                          Description
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-[1.6] font-light">
                          {detail.DetailedDescription}
                        </p>
                      </section>
                    )}

                    {/* Action Buttons */}
                    <section className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => navigate(`/admin/products/update/${selectedId}`)}
                        className="flex-1 py-4 bg-primary text-on-primary flex items-center justify-center gap-2 rounded-xl hover:bg-primary-container transition-all active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-xl">
                          edit
                        </span>
                        <span className="text-xs tracking-widest uppercase font-bold">
                          Modify Product
                        </span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex-1 py-4 bg-transparent border border-error/20 text-error flex items-center justify-center gap-2 rounded-xl hover:bg-error/5 transition-all active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-xl">
                          delete
                        </span>
                        <span className="text-xs tracking-widest uppercase font-bold">
                          Delete Product
                        </span>
                      </button>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-on-surface-variant">
              <p className="text-sm font-light">
                Failed to load product details.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal}
        title="Delete Product"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleting}
        success={deleteSuccess}
        successMessage="Product Deleted!"
        error={deleteError}
      >
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Are you sure you want to permanently delete{" "}
          <strong className="text-on-surface">{detail?.ProductName}</strong>?
          This action cannot be undone. All product images will also be removed.
        </p>
      </ConfirmModal>
    </div>
  );
}
