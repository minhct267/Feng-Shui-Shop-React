import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchAdminPromotions,
  deletePromotion,
} from "../../services/adminApi";
import ConfirmModal from "../../components/ConfirmModal";

const STATUS_TONE = {
  active: "bg-secondary-container text-on-secondary-container",
  upcoming: "bg-primary-fixed text-on-primary-fixed",
  expired: "bg-surface-container-highest text-on-surface-variant",
};

const STATUS_LABEL = {
  active: "Active",
  upcoming: "Upcoming",
  expired: "Expired",
};

export default function AdminPromotionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminPromotions();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deletePromotion(pendingDelete.PromotionId);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-8 custom-scrollbar">
      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
            Promotions
          </h1>
          <p className="text-on-surface-variant font-light max-w-md mt-2">
            Curate seasonal blessings &mdash; each promotion can be linked to
            artifacts in the Update Product flow.
          </p>
        </div>
        <Link
          to="/admin/promotions/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary py-2.5 px-5 rounded-full font-label uppercase tracking-widest text-[10px] shadow hover:shadow-md transition-all"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Create Promotion
        </Link>
      </div>

      {error && !loading && (
        <div className="bg-error-container text-on-error-container px-5 py-4 rounded-sm text-sm font-label mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high animate-pulse"
            >
              <div className="h-5 w-2/3 rounded bg-surface-container mb-3" />
              <div className="h-3 w-1/2 rounded bg-surface-container mb-6" />
              <div className="h-3 w-full rounded bg-surface-container mb-2" />
              <div className="h-3 w-5/6 rounded bg-surface-container" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-4 block">
            sell
          </span>
          <h2 className="text-2xl font-headline italic text-on-surface mb-2">
            No promotions yet
          </h2>
          <p className="text-sm text-on-surface-variant mb-8 max-w-md mx-auto">
            Compose a seasonal blessing to highlight artifacts in the
            collection.
          </p>
          <Link
            to="/admin/promotions/new"
            className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label uppercase tracking-widest text-xs"
          >
            Create your first promotion
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((p) => (
            <div
              key={p.PromotionId}
              className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high flex flex-col"
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <h3 className="font-headline italic text-xl text-on-surface leading-tight">
                  {p.PromotionName}
                </h3>
                <span
                  className={`px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full whitespace-nowrap ${STATUS_TONE[p.status] || STATUS_TONE.expired}`}
                >
                  {STATUS_LABEL[p.status] || p.status}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-outline mb-4">
                {p.StartDate} &rarr; {p.EndDate}
              </p>
              <p className="text-sm text-on-surface-variant flex-grow line-clamp-3 font-light leading-relaxed">
                {p.Details}
              </p>
              <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    inventory_2
                  </span>
                  {p.linked_product_count}{" "}
                  {p.linked_product_count === 1 ? "artifact" : "artifacts"}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/promotions/${p.PromotionId}`)}
                    className="text-[10px] uppercase tracking-widest font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setPendingDelete(p);
                    }}
                    className="text-[10px] uppercase tracking-widest font-bold text-outline hover:text-tertiary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="Release this promotion?"
        confirmLabel="Delete promotion"
        cancelLabel="Keep"
        variant="destructive"
        loading={deleting}
        loadingMessage="Deleting..."
        error={deleteError}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={confirmDelete}
      >
        <p className="text-on-surface-variant text-sm">
          Are you sure you want to delete
          {pendingDelete ? (
            <span className="font-bold text-on-surface">
              {" "}
              {pendingDelete.PromotionName}
              {" "}
            </span>
          ) : (
            " this promotion "
          )}
          ?
          {pendingDelete && pendingDelete.linked_product_count > 0 && (
            <>
              <br />
              <span className="text-tertiary font-bold">
                {pendingDelete.linked_product_count}{" "}
                {pendingDelete.linked_product_count === 1
                  ? "artifact"
                  : "artifacts"}{" "}
                will be unlinked.
              </span>
            </>
          )}
        </p>
      </ConfirmModal>
    </div>
  );
}
