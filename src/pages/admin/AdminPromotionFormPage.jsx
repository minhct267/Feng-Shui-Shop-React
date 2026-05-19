import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchAdminPromotionDetail,
  createPromotion,
  updatePromotion,
} from "../../services/adminApi";

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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function previewStatus(start, end) {
  if (!start || !end) return null;
  const today = todayIso();
  if (today < start) return "upcoming";
  if (today > end) return "expired";
  return "active";
}

export default function AdminPromotionFormPage() {
  const { promotionId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!promotionId;

  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [start, setStart] = useState(todayIso());
  const [end, setEnd] = useState(todayIso());
  const [linkedCount, setLinkedCount] = useState(0);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    fetchAdminPromotionDetail(promotionId)
      .then((data) => {
        if (cancelled) return;
        setName(data.PromotionName);
        setDetails(data.Details);
        setStart(data.StartDate);
        setEnd(data.EndDate);
        setLinkedCount(data.linked_product_count);
      })
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [promotionId, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!name.trim()) {
      setSubmitError("Promotion name is required.");
      return;
    }
    if (!details.trim()) {
      setSubmitError("Details are required.");
      return;
    }
    if (!start || !end) {
      setSubmitError("Both start and end dates are required.");
      return;
    }
    if (end < start) {
      setSubmitError("End date must be on or after the start date.");
      return;
    }

    const payload = {
      PromotionName: name.trim(),
      Details: details.trim(),
      StartDate: start,
      EndDate: end,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updatePromotion(promotionId, payload);
      } else {
        await createPromotion(payload);
      }
      navigate("/admin/promotions");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-on-surface-variant font-label uppercase tracking-widest text-xs flex items-center justify-center gap-2">
        <span className="material-symbols-outlined animate-spin text-sm">
          progress_activity
        </span>
        Channeling promotion...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-headline text-on-surface mb-4">
          Promotion not found
        </h1>
        <p className="text-on-surface-variant mb-8">{loadError}</p>
        <Link
          to="/admin/promotions"
          className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label uppercase tracking-widest text-xs"
        >
          Return to promotions
        </Link>
      </div>
    );
  }

  const status = previewStatus(start, end);

  return (
    <div className="p-8 custom-scrollbar">
      <nav className="mb-6 flex items-center space-x-2 text-xs font-label uppercase tracking-widest text-on-surface-variant">
        <Link to="/admin/promotions" className="hover:text-primary transition-colors">
          Promotions
        </Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-primary font-bold">
          {isEdit ? "Edit" : "Create"}
        </span>
      </nav>

      <h1 className="text-4xl font-headline font-bold text-primary tracking-tight mb-8">
        {isEdit ? "Edit Promotion" : "Create Promotion"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <form
          className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 space-y-6 border border-surface-container-high"
          onSubmit={handleSubmit}
        >
          <div>
            <label
              htmlFor="promotion_name"
              className="font-label uppercase tracking-widest text-[10px] text-outline block mb-2"
            >
              Promotion name
            </label>
            <input
              id="promotion_name"
              type="text"
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spring Harmony Sale"
              className="w-full bg-transparent border-b border-outline-variant/40 py-2 text-sm focus:border-primary outline-none"
              required
            />
          </div>
          <div>
            <label
              htmlFor="promotion_details"
              className="font-label uppercase tracking-widest text-[10px] text-outline block mb-2"
            >
              Details
            </label>
            <textarea
              id="promotion_details"
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the blessing patrons will receive..."
              className="w-full bg-transparent border border-outline-variant/40 rounded-lg p-3 text-sm focus:border-primary outline-none resize-none"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="promotion_start"
                className="font-label uppercase tracking-widest text-[10px] text-outline block mb-2"
              >
                Start date
              </label>
              <input
                id="promotion_start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/40 py-2 text-sm focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label
                htmlFor="promotion_end"
                className="font-label uppercase tracking-widest text-[10px] text-outline block mb-2"
              >
                End date
              </label>
              <input
                id="promotion_end"
                type="date"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/40 py-2 text-sm focus:border-primary outline-none"
                required
              />
            </div>
          </div>

          {submitError && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-sm text-sm font-label">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant/20">
            <Link
              to="/admin/promotions"
              className="text-[10px] uppercase tracking-widest font-bold text-outline hover:text-on-surface"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary py-3 px-6 rounded-full font-label uppercase tracking-widest text-[10px] shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">
                    progress_activity
                  </span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">
                    auto_awesome
                  </span>
                  {isEdit ? "Save changes" : "Create promotion"}
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="bg-surface-container-highest rounded-xl p-8">
              <h3 className="font-label uppercase tracking-widest text-[10px] text-outline mb-4">
                Preview
              </h3>
              <div className="flex justify-between items-start gap-2 mb-3">
                <p className="font-headline italic text-xl text-on-surface">
                  {name || "Untitled promotion"}
                </p>
                {status && (
                  <span
                    className={`px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full whitespace-nowrap ${STATUS_TONE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-widest text-outline mb-4">
                {start} &rarr; {end}
              </p>
              <p className="text-sm text-on-surface-variant font-light leading-relaxed">
                {details ||
                  "A blessing description will appear here as you compose it."}
              </p>
            </div>
            {isEdit && linkedCount > 0 && (
              <div className="bg-secondary-container text-on-secondary-container rounded-lg p-5 text-sm">
                <p className="font-bold mb-1">
                  {linkedCount}{" "}
                  {linkedCount === 1 ? "artifact" : "artifacts"} linked
                </p>
                <p className="text-xs">
                  Editing this promotion will affect every linked artifact
                  immediately.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
