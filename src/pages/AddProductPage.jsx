import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { fetchCategories, fetchPromotions, createProduct, checkProductName } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

const DRAFT_KEY = "addProductDraft";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

const CATEGORY_SLUG = {
  Bracelets: "bracelet",
  Necklaces: "necklace",
  Pendants: "pendant",
  Brooches: "brooch",
  Rings: "ring",
  Earrings: "earring",
  "Hair Accessories": "hair",
  Keychains: "keychain",
  Cabochons: "cabochon",
  "Decorative Bottles": "bottle",
  Cosmetics: "cosmetic",
  Mirrors: "mirror",
};

function safeFilename(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s-]+/g, "_");
}

const EMPTY_FORM = {
  productName: "",
  price: "",
  oldPrice: "",
  shortDescription: "",
  detailedDescription: "",
  quantity: "",
  categoryId: "",
  promotionId: "",
};

function validateForm(form, images, nameStatus) {
  const errors = {};
  const name = form.productName.trim();
  if (!name) errors.productName = "Product name is required.";
  else if (name.length > 100) errors.productName = "Product name must be at most 100 characters.";
  else if (nameStatus === "taken") errors.productName = "A product with this name already exists.";

  if (!form.categoryId) errors.categoryId = "Please select a category.";

  const price = parseFloat(form.price);
  if (!form.price || isNaN(price) || price <= 0) errors.price = "Price must be a positive number.";

  if (form.oldPrice) {
    const old = parseFloat(form.oldPrice);
    if (isNaN(old) || old <= 0) errors.oldPrice = "Old price must be a positive number.";
    else if (!isNaN(price) && old <= price) errors.oldPrice = "Old price must be greater than current price.";
  }

  const qty = parseInt(form.quantity, 10);
  if (form.quantity === "" || isNaN(qty) || qty < 0) errors.quantity = "Quantity must be zero or a positive integer.";

  if (form.shortDescription && form.shortDescription.length > 255)
    errors.shortDescription = "Short description must be at most 255 characters.";

  if (!images || images.length === 0) errors.images = "At least one product image is required.";

  return errors;
}

export default function AddProductPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [draftBanner, setDraftBanner] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragIdx, setDragIdx] = useState(null);
  const [nameStatus, setNameStatus] = useState("idle"); // "idle" | "checking" | "available" | "taken"

  const fileInputRef = useRef(null);
  const saveTimerRef = useRef(null);
  const nameCheckRef = useRef(null);
  const nameCheckAbortRef = useRef(null);

  // Load categories and promotions
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchPromotions().then(setPromotions).catch(() => {});
  }, []);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.productName) {
          setDraftBanner(true);
          setForm(parsed);
        }
      }
    } catch {
      /* ignore corrupt data */
    }
  }, []);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!dirty) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {
        /* quota exceeded, ignore */
      }
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [form, dirty]);

  // Debounced product name duplicate check
  useEffect(() => {
    const name = form.productName.trim();
    if (!name) {
      setNameStatus("idle");
      return;
    }

    setNameStatus("checking");
    clearTimeout(nameCheckRef.current);
    if (nameCheckAbortRef.current) nameCheckAbortRef.current.abort();

    nameCheckRef.current = setTimeout(async () => {
      const controller = new AbortController();
      nameCheckAbortRef.current = controller;
      try {
        const data = await checkProductName(name);
        if (!controller.signal.aborted) {
          setNameStatus(data.exists ? "taken" : "available");
        }
      } catch {
        if (!controller.signal.aborted) setNameStatus("idle");
      }
    }, 500);

    return () => {
      clearTimeout(nameCheckRef.current);
      if (nameCheckAbortRef.current) nameCheckAbortRef.current.abort();
    };
  }, [form.productName]);

  // Unsaved changes: beforeunload
  useEffect(() => {
    function handler(e) {
      if (dirty && !submitSuccess) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, submitSuccess]);

  // Unsaved changes: React Router blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !submitSuccess && currentLocation.pathname !== nextLocation.pathname
  );

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // --- Image handlers ---
  function addFiles(fileList) {
    const newImages = [...images];
    for (const file of fileList) {
      if (newImages.length >= MAX_IMAGES) break;
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      newImages.push({ file, preview: URL.createObjectURL(file), description: "" });
    }
    setImages(newImages);
    setDirty(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
  }

  function removeImage(idx) {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
    setDirty(true);
  }

  function updateImageDesc(idx, desc) {
    setImages((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], description: desc };
      return next;
    });
  }

  // Drag-and-drop reorder
  function handleDragStart(idx) {
    setDragIdx(idx);
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
  }

  function handleDrop(e, targetIdx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setDragIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  // Dropzone handlers
  function handleDropZone(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
  }

  function handleDropZoneDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // --- Form submit ---
  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateForm(form, images, nameStatus);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSubmitError("");
    setShowConfirm(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError("");
    setUploadProgress("Preparing upload...");

    try {
      const fd = new FormData();
      fd.append("product_name", form.productName.trim());
      fd.append("price", form.price);
      if (form.oldPrice) fd.append("old_price", form.oldPrice);
      if (form.shortDescription) fd.append("short_description", form.shortDescription);
      if (form.detailedDescription) fd.append("detailed_description", form.detailedDescription);
      fd.append("quantity", form.quantity);
      fd.append("category_id", form.categoryId);
      if (form.promotionId) fd.append("promotion_id", form.promotionId);

      const descs = images.map((img) => img.description || "");
      fd.append("image_descriptions", JSON.stringify(descs));

      for (let i = 0; i < images.length; i++) {
        fd.append("images", images[i].file);
      }

      setUploadProgress(`Uploading ${images.length} image${images.length > 1 ? "s" : ""}...`);

      await createProduct(fd);

      setSubmitSuccess(true);
      setDirty(false);
      localStorage.removeItem(DRAFT_KEY);

      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (err) {
      setSubmitError(err.message || "An error occurred while creating the product.");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }

  function handleDiscard() {
    if (!dirty || window.confirm("Are you sure you want to discard this draft?")) {
      setForm({ ...EMPTY_FORM });
      setImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.preview));
        return [];
      });
      setErrors({});
      setDirty(false);
      localStorage.removeItem(DRAFT_KEY);
      setDraftBanner(false);
    }
  }

  function dismissDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setForm({ ...EMPTY_FORM });
    setDraftBanner(false);
  }

  // Resolve category name for preview
  const selectedCategory = categories.find((c) => String(c.CategoryId) === String(form.categoryId));

  const inputClass =
    "w-full bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-primary px-0 py-2 text-lg font-body placeholder:text-surface-dim transition-all";

  const labelClass = "font-label uppercase tracking-widest text-[10px] text-on-surface-variant block mb-1";

  const errorClass = "text-error text-xs mt-1";

  return (
    <div className="p-8 pb-24 max-w-5xl mx-auto">
      {/* Live Preview Card */}
      <div className="mb-10 flex flex-col sm:flex-row gap-6 items-start bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-surface-container-high">
        <div className="w-full sm:w-40 aspect-[4/5] sm:aspect-square bg-surface-container overflow-hidden flex-shrink-0">
          {images.length > 0 ? (
            <img className="w-full h-full object-cover" alt="Preview" src={images[0].preview} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/40">
              <span className="material-symbols-outlined text-4xl mb-2">image</span>
              <span className="text-xs">No Image</span>
            </div>
          )}
        </div>
        <div className="p-4 sm:py-5">
          <span className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-1 block">
            {selectedCategory?.CategoryName || "Category"}
          </span>
          <h3 className="font-headline text-lg text-on-surface mb-1 truncate">
            {form.productName || "Product Name"}
          </h3>
          <p className="text-on-surface-variant text-xs font-light italic truncate">
            {form.shortDescription || "Short description..."}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-headline text-sm text-primary">
              {form.price ? `$${parseFloat(form.price).toFixed(0)}` : "$0"}
            </span>
            {form.oldPrice && (
              <span className="font-headline text-xs text-on-surface-variant line-through">
                ${parseFloat(form.oldPrice).toFixed(0)}
              </span>
            )}
          </div>
          {form.quantity !== "" && (
            <span className="inline-block mt-2 text-[10px] font-label uppercase tracking-widest bg-surface-container px-2 py-1 rounded text-on-surface-variant">
              Qty: {form.quantity}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-12">
        <header>
          <h1 className="text-4xl md:text-5xl font-headline text-on-background leading-tight">
            Manifest New Essence
          </h1>
          <p className="mt-4 text-on-surface-variant text-lg font-light leading-relaxed max-w-2xl">
            Define the vessel, the price, and the ancient properties. Every entry contributes to the collective balance of the Sanctuary.
          </p>
        </header>

        {/* Draft restore banner */}
        {draftBanner && (
          <div className="flex items-center justify-between bg-surface-container-high px-6 py-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">history</span>
              <span className="text-sm text-on-surface">You have an unsaved draft. Restore it?</span>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant hover:text-on-background transition-colors"
                onClick={dismissDraft}
              >
                Discard
              </button>
              <button
                type="button"
                className="font-label uppercase tracking-widest text-[10px] text-primary font-bold hover:text-primary-container transition-colors"
                onClick={() => setDraftBanner(false)}
              >
                Restore
              </button>
            </div>
          </div>
        )}

        <form className="space-y-16" onSubmit={handleSubmit}>
          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* Category (first so admin picks type before naming) */}
            <div className="space-y-2">
              <label className={labelClass}>Category *</label>
              <select
                className={inputClass + " cursor-pointer"}
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryId} value={cat.CategoryId}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className={errorClass}>{errors.categoryId}</p>}
            </div>

            {/* Product Name with duplicate check */}
            <div className="space-y-2">
              <label className={labelClass}>Product Name *</label>
              <div className="relative">
                <input
                  className={`${inputClass} ${
                    nameStatus === "available"
                      ? "border-green-600 focus:border-green-600"
                      : nameStatus === "taken"
                        ? "border-error focus:border-error"
                        : ""
                  }`}
                  type="text"
                  placeholder="e.g. Celestial Amethyst Cluster"
                  maxLength={100}
                  value={form.productName}
                  onChange={(e) => updateField("productName", e.target.value)}
                />
                {nameStatus === "checking" && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined animate-spin text-on-surface-variant text-base">
                    progress_activity
                  </span>
                )}
                {nameStatus === "available" && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: '"FILL" 1' }}>
                    check_circle
                  </span>
                )}
                {nameStatus === "taken" && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-error text-base" style={{ fontVariationSettings: '"FILL" 1' }}>
                    error
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                {nameStatus === "available" && (
                  <span className="text-[10px] text-green-600 font-medium">Name is available</span>
                )}
                {nameStatus === "taken" && (
                  <span className="text-[10px] text-error font-medium">A product with this name already exists</span>
                )}
                {nameStatus !== "available" && nameStatus !== "taken" && <span />}
                {form.productName && (
                  <span className="text-[10px] text-on-surface-variant">{form.productName.length}/100</span>
                )}
              </div>
              {errors.productName && <p className={errorClass}>{errors.productName}</p>}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className={labelClass}>Price (USD) *</label>
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
              />
              {errors.price && <p className={errorClass}>{errors.price}</p>}
            </div>

            {/* Old Price */}
            <div className="space-y-2">
              <label className={labelClass}>Old Price (USD)</label>
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                placeholder="Original price before discount"
                value={form.oldPrice}
                onChange={(e) => updateField("oldPrice", e.target.value)}
              />
              {errors.oldPrice && <p className={errorClass}>{errors.oldPrice}</p>}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className={labelClass}>Quantity *</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                placeholder="Stock count"
                value={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
              />
              {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
            </div>

            {/* Promotion */}
            <div className="space-y-2">
              <label className={labelClass}>Promotion</label>
              <select
                className={inputClass + " cursor-pointer"}
                value={form.promotionId}
                onChange={(e) => updateField("promotionId", e.target.value)}
              >
                <option value="">None</option>
                {promotions.map((promo) => (
                  <option key={promo.PromotionId} value={promo.PromotionId}>
                    {promo.PromotionName}
                  </option>
                ))}
              </select>
            </div>

            {/* Short Description */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className={labelClass}>Short Description</label>
              <input
                className={inputClass}
                type="text"
                maxLength={255}
                placeholder="One-line summary shown on product cards"
                value={form.shortDescription}
                onChange={(e) => updateField("shortDescription", e.target.value)}
              />
              {form.shortDescription && (
                <span className="text-[10px] text-on-surface-variant">{form.shortDescription.length}/255</span>
              )}
              {errors.shortDescription && <p className={errorClass}>{errors.shortDescription}</p>}
            </div>

            {/* Detailed Description */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className={labelClass}>Detailed Description</label>
              <div className="mt-4 bg-surface-container-lowest p-6 min-h-[200px] shadow-sm rounded-lg border-l-4 border-primary">
                <textarea
                  className="w-full bg-transparent border-0 focus:ring-0 px-0 py-0 text-on-surface-variant font-light leading-relaxed placeholder:text-surface-dim resize-none min-h-[160px]"
                  placeholder="Describe the energy, aura, origin, and spiritual properties of the product..."
                  value={form.detailedDescription}
                  onChange={(e) => updateField("detailedDescription", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sacred Imagery Section */}
          <div className="space-y-8">
            <div className="flex items-end gap-4">
              <h3 className="text-3xl font-headline text-on-background">Sacred Imagery</h3>
              <div className="flex-grow h-px bg-outline-variant/20 mb-3"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Dropzone */}
              <div
                className="md:col-span-2 aspect-[4/3] md:aspect-auto flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/40 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer group min-h-[200px]"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDropZone}
                onDragOver={handleDropZoneDragOver}
              >
                <span className="material-symbols-outlined text-5xl text-outline-variant group-hover:text-primary mb-4 transition-colors">
                  add_a_photo
                </span>
                <p className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant">
                  Drag and drop or click to browse
                </p>
                <p className="text-[10px] text-on-surface-variant/60 mt-2">
                  JPEG, PNG, WebP &middot; Max 5 MB &middot; Up to {MAX_IMAGES} images
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) addFiles(Array.from(e.target.files));
                    e.target.value = "";
                  }}
                />
              </div>

              {/* Image Previews */}
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`aspect-square bg-surface-container rounded-2xl overflow-hidden relative group cursor-grab ${
                    dragIdx === idx ? "opacity-40" : ""
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <img
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
                    alt={img.description || `Image ${idx + 1}`}
                    src={img.preview}
                  />

                  {/* Numbered badge */}
                  <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shadow-md">
                    {idx + 1}
                  </div>

                  {/* Hover overlay with delete */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      type="button"
                      className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
                      onClick={() => removeImage(idx)}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {images.length > 0 && (
              <p className="text-xs text-on-surface-variant/70 italic">
                The first image will be used as the product thumbnail on the homepage. Drag images to reorder.
              </p>
            )}

            {/* Image name preview */}
            {images.length > 0 && form.productName.trim() && form.categoryId && (
              <div className="bg-surface-container-lowest rounded-lg p-4 space-y-2">
                <p className="text-xs font-label uppercase tracking-widest text-primary">
                  Planned Blob Names
                </p>
                <div className="space-y-1">
                  {images.map((img, idx) => {
                    const slug = safeFilename(form.productName);
                    const catSlug = CATEGORY_SLUG[selectedCategory?.CategoryName] || safeFilename(selectedCategory?.CategoryName || "");
                    const ext = img.file?.name?.split(".").pop()?.toLowerCase() || "jpg";
                    return (
                      <p key={idx} className="text-xs text-on-surface-variant font-mono">
                        <span className="text-on-surface font-semibold">{idx + 1}.</span>{" "}
                        {slug}_{catSlug}_{idx + 1}.{ext}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Per-image descriptions */}
            {images.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
                  Image Descriptions (optional)
                </p>
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      className="flex-1 bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-primary px-0 py-1 text-sm font-body placeholder:text-surface-dim transition-all"
                      type="text"
                      placeholder={`Description for image ${idx + 1}`}
                      value={img.description}
                      onChange={(e) => updateImageDesc(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {errors.images && <p className={errorClass}>{errors.images}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-8 pt-8">
            <button
              type="button"
              className="text-on-surface-variant font-label uppercase tracking-widest text-xs hover:text-on-background transition-colors"
              onClick={handleDiscard}
            >
              Discard Draft
            </button>
            <button
              type="submit"
              disabled={nameStatus === "taken"}
              className={`bg-primary text-white px-12 py-5 rounded-full font-label uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all flex items-center gap-3 ${
                nameStatus === "taken"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-primary-container"
              }`}
            >
              Curate Product
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirm}
        title="Confirm New Product"
        confirmLabel="Confirm & Add Product"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!submitting) {
            setShowConfirm(false);
            setSubmitError("");
          }
        }}
        loading={submitting}
        success={submitSuccess}
        successMessage="Product created successfully!"
        error={submitError}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            {images.length > 0 && (
              <img
                className="w-16 h-16 rounded-lg object-cover shrink-0"
                src={images[0].preview}
                alt="Preview"
              />
            )}
            <div className="min-w-0">
              <h4 className="font-headline text-lg text-on-surface truncate">{form.productName}</h4>
              <p className="text-on-surface-variant text-sm">{selectedCategory?.CategoryName || "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-on-surface-variant">Price:</span>{" "}
              <span className="text-on-surface font-semibold">${parseFloat(form.price || 0).toFixed(2)}</span>
            </div>
            {form.oldPrice && (
              <div>
                <span className="text-on-surface-variant">Old Price:</span>{" "}
                <span className="text-on-surface line-through">${parseFloat(form.oldPrice).toFixed(2)}</span>
              </div>
            )}
            <div>
              <span className="text-on-surface-variant">Quantity:</span>{" "}
              <span className="text-on-surface font-semibold">{form.quantity}</span>
            </div>
            <div>
              <span className="text-on-surface-variant">Images:</span>{" "}
              <span className="text-on-surface font-semibold">{images.length}</span>
            </div>
          </div>
          {uploadProgress && (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant italic">{uploadProgress}</p>
              <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-[progressIndeterminate_1.5s_ease-in-out_infinite] w-1/3" />
              </div>
            </div>
          )}
        </div>
      </ConfirmModal>

      {/* React Router navigation blocker */}
      {blocker.state === "blocked" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-headline text-on-surface mb-4">Unsaved Changes</h3>
            <p className="text-on-surface-variant text-sm mb-8">
              You have unsaved changes. Are you sure you want to leave this page?
            </p>
            <div className="flex justify-end gap-6">
              <button
                type="button"
                className="text-on-surface-variant font-label uppercase tracking-widest text-xs hover:text-on-background transition-colors"
                onClick={() => blocker.reset()}
              >
                Stay
              </button>
              <button
                type="button"
                className="bg-error text-on-error px-8 py-3 rounded-full font-label uppercase tracking-widest text-xs"
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  blocker.proceed();
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
