import { useEffect, useState } from "react";
import {
  fetchAdminCategoriesWithCounts,
  updateCategoryDescription,
} from "../../services/adminApi";

function CategoryRow({ category, onSaved }) {
  const [description, setDescription] = useState(category.Description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(0);

  const dirty = (description || "") !== (category.Description || "");

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    setError("");
    try {
      const next = await updateCategoryDescription(
        category.CategoryId,
        description.trim(),
      );
      setSavedAt(Date.now());
      onSaved?.(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setDescription(category.Description || "");
    setError("");
  }

  const showSavedFlash = !dirty && savedAt && Date.now() - savedAt < 4000;

  return (
    <tr className="align-top">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline text-base">
            lock
          </span>
          <span className="font-headline text-on-surface">
            {category.CategoryName}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 w-full">
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-transparent border border-outline-variant/30 focus:border-primary rounded-lg p-2 text-sm font-light outline-none transition-colors resize-y"
          placeholder="A short description shown to patrons..."
        />
        {error && (
          <p className="mt-2 text-xs text-error font-label">{error}</p>
        )}
        {showSavedFlash && !error && (
          <p className="mt-2 text-[10px] uppercase tracking-widest text-secondary font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check</span>
            Saved
          </p>
        )}
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <span className="font-label text-on-surface-variant tabular-nums">
          {category.product_count}
        </span>
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-3">
          {dirty && !saving && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] uppercase tracking-widest font-bold text-outline hover:text-on-surface"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 bg-primary text-on-primary py-2 px-4 rounded-full font-label uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-container transition-colors"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">
                  progress_activity
                </span>
                Saving
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                Save
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminCategoriesWithCounts()
      .then((data) => !cancelled && setCategories(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSaved(next) {
    setCategories((prev) =>
      prev.map((c) => (c.CategoryId === next.CategoryId ? next : c)),
    );
  }

  return (
    <div className="p-8 custom-scrollbar">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
          Categories
        </h1>
        <p className="text-on-surface-variant font-light max-w-2xl mt-2">
          Refine the description of each elemental family. Names are locked
          because they tie into image storage paths &mdash; new categories will
          arrive in a future release.
        </p>
      </div>

      <div className="bg-secondary-container/40 text-on-secondary-container rounded-lg p-4 mb-6 flex items-start gap-3 text-sm">
        <span className="material-symbols-outlined text-base">info</span>
        <p className="font-light leading-relaxed">
          Edit any description below and press <strong>Save</strong>. The change
          will be reflected immediately in product cards and detail pages.
        </p>
      </div>

      {error && !loading && (
        <div className="bg-error-container text-on-error-container px-5 py-4 rounded-sm text-sm font-label mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container-high">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Category
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline">
                Description
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline text-right">
                Products
              </th>
              <th className="px-6 py-4 text-[10px] tracking-widest uppercase font-bold text-outline text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-24 rounded bg-surface-container animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : categories.map((c) => (
                  <CategoryRow
                    key={c.CategoryId}
                    category={c}
                    onSaved={handleSaved}
                  />
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
