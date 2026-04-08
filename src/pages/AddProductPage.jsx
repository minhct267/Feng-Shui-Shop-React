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
  const [nameStatus, setNameStatus] = useState("idle");

  const fileInputRef = useRef(null);
  const saveTimerRef = useRef(null);
  const nameCheckRef = useRef(null);
  const nameCheckAbortRef = useRef(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchPromotions().then(setPromotions).catch(() => {});
  }, []);

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

  useEffect(() => {
    function handler(e) {
      if (dirty && !submitSuccess) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, submitSuccess]);

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

  function handleDragStart(idx) {
    setDragIdx(idx);
  }

  function handleDragOver(e) {
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

  function handleDropZone(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
  }

  function handleDropZoneDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

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

  const selectedCategory = categories.find((c) => String(c.CategoryId) === String(form.categoryId));

  return (
    <div className="admin-form-container">
      {/* Live Preview Card */}
      <div className="live-preview">
        <div className="live-preview-thumb">
          {images.length > 0 ? (
            <img alt="Preview" src={images[0].preview} />
          ) : (
            <div className="live-preview-no-image">
              <span className="material-symbols-outlined">image</span>
              <span>No Image</span>
            </div>
          )}
        </div>
        <div className="live-preview-info">
          <span className="live-preview-category">
            {selectedCategory?.CategoryName || "Category"}
          </span>
          <h3 className="live-preview-name">
            {form.productName || "Product Name"}
          </h3>
          <p className="live-preview-desc">
            {form.shortDescription || "Short description..."}
          </p>
          <div className="live-preview-prices">
            <span className="live-preview-price">
              {form.price ? `$${parseFloat(form.price).toFixed(0)}` : "$0"}
            </span>
            {form.oldPrice && (
              <span className="live-preview-old-price">
                ${parseFloat(form.oldPrice).toFixed(0)}
              </span>
            )}
          </div>
          {form.quantity !== "" && (
            <span className="live-preview-qty">Qty: {form.quantity}</span>
          )}
        </div>
      </div>

      <div className="admin-form-sections">
        <header className="content-header">
          <h1>Manifest New Essence</h1>
          <p>
            Define the vessel, the price, and the ancient properties. Every entry contributes to the collective balance of the Sanctuary.
          </p>
        </header>

        {/* Draft restore banner */}
        {draftBanner && (
          <div className="draft-banner">
            <div className="draft-banner-info">
              <span className="material-symbols-outlined">history</span>
              <span>You have an unsaved draft. Restore it?</span>
            </div>
            <div className="draft-banner-actions">
              <button type="button" className="draft-discard" onClick={dismissDraft}>
                Discard
              </button>
              <button type="button" className="draft-restore" onClick={() => setDraftBanner(false)}>
                Restore
              </button>
            </div>
          </div>
        )}

        <form className="admin-form" onSubmit={handleSubmit}>
          {/* Product Information */}
          <div className="form-grid">
            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-input"
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
              {errors.categoryId && <p className="field-error">{errors.categoryId}</p>}
            </div>

            {/* Product Name with duplicate check */}
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <div className="name-field-wrapper">
                <input
                  className={`form-input${nameStatus === "available" ? " available" : ""}${nameStatus === "taken" ? " taken" : ""}`}
                  type="text"
                  placeholder="e.g. Celestial Amethyst Cluster"
                  maxLength={100}
                  value={form.productName}
                  onChange={(e) => updateField("productName", e.target.value)}
                />
                {nameStatus === "checking" && (
                  <span className="material-symbols-outlined name-status-icon checking animate-spin">
                    progress_activity
                  </span>
                )}
                {nameStatus === "available" && (
                  <span className="material-symbols-outlined name-status-icon available" style={{ fontVariationSettings: '"FILL" 1' }}>
                    check_circle
                  </span>
                )}
                {nameStatus === "taken" && (
                  <span className="material-symbols-outlined name-status-icon taken" style={{ fontVariationSettings: '"FILL" 1' }}>
                    error
                  </span>
                )}
              </div>
              <div className="name-status-row">
                {nameStatus === "available" && (
                  <span className="name-status-msg available">Name is available</span>
                )}
                {nameStatus === "taken" && (
                  <span className="name-status-msg taken">A product with this name already exists</span>
                )}
                {nameStatus !== "available" && nameStatus !== "taken" && <span />}
                {form.productName && (
                  <span className="name-counter">{form.productName.length}/100</span>
                )}
              </div>
              {errors.productName && <p className="field-error">{errors.productName}</p>}
            </div>

            {/* Price */}
            <div className="form-group">
              <label className="form-label">Price (USD) *</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
              />
              {errors.price && <p className="field-error">{errors.price}</p>}
            </div>

            {/* Old Price */}
            <div className="form-group">
              <label className="form-label">Old Price (USD)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Original price before discount"
                value={form.oldPrice}
                onChange={(e) => updateField("oldPrice", e.target.value)}
              />
              {errors.oldPrice && <p className="field-error">{errors.oldPrice}</p>}
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="1"
                placeholder="Stock count"
                value={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
              />
              {errors.quantity && <p className="field-error">{errors.quantity}</p>}
            </div>

            {/* Promotion */}
            <div className="form-group">
              <label className="form-label">Promotion</label>
              <select
                className="form-input"
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
            <div className="form-group full-width">
              <label className="form-label">Short Description</label>
              <input
                className="form-input"
                type="text"
                maxLength={255}
                placeholder="One-line summary shown on product cards"
                value={form.shortDescription}
                onChange={(e) => updateField("shortDescription", e.target.value)}
              />
              {form.shortDescription && (
                <span className="char-counter">{form.shortDescription.length}/255</span>
              )}
              {errors.shortDescription && <p className="field-error">{errors.shortDescription}</p>}
            </div>

            {/* Detailed Description */}
            <div className="form-group full-width">
              <label className="form-label">Detailed Description</label>
              <div className="editor-container">
                <textarea
                  className="editor-textarea"
                  placeholder="Describe the energy, aura, origin, and spiritual properties of the product..."
                  value={form.detailedDescription}
                  onChange={(e) => updateField("detailedDescription", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sacred Imagery Section */}
          <div className="imagery-section">
            <div className="section-divider">
              <h3>Sacred Imagery</h3>
              <div className="divider-line"></div>
            </div>

            <div className="imagery-grid">
              {/* Dropzone */}
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDropZone}
                onDragOver={handleDropZoneDragOver}
              >
                <span className="material-symbols-outlined dropzone-icon">add_a_photo</span>
                <p className="dropzone-label">Drag and drop or click to browse</p>
                <p className="dropzone-hint">
                  JPEG, PNG, WebP &middot; Max 5 MB &middot; Up to {MAX_IMAGES} images
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden-input"
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
                  className={`image-card draggable${dragIdx === idx ? " dragging" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <img
                    alt={img.description || `Image ${idx + 1}`}
                    src={img.preview}
                  />
                  <div className="image-badge">{idx + 1}</div>
                  <div className="image-hover-overlay">
                    <button
                      type="button"
                      className="image-delete-btn"
                      onClick={() => removeImage(idx)}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {images.length > 0 && (
              <p className="imagery-helper-text">
                The first image will be used as the product thumbnail on the homepage. Drag images to reorder.
              </p>
            )}

            {/* Image name preview */}
            {images.length > 0 && form.productName.trim() && form.categoryId && (
              <div className="blob-names-card">
                <p className="blob-names-title">Planned Blob Names</p>
                <div>
                  {images.map((img, idx) => {
                    const slug = safeFilename(form.productName);
                    const catSlug = CATEGORY_SLUG[selectedCategory?.CategoryName] || safeFilename(selectedCategory?.CategoryName || "");
                    const ext = img.file?.name?.split(".").pop()?.toLowerCase() || "jpg";
                    return (
                      <p key={idx} className="blob-name-item">
                        <span className="blob-name-num">{idx + 1}.</span>{" "}
                        {slug}_{catSlug}_{idx + 1}.{ext}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Per-image descriptions */}
            {images.length > 0 && (
              <div className="image-desc-list">
                <p className="image-desc-title">Image Descriptions (optional)</p>
                {images.map((img, idx) => (
                  <div key={idx} className="image-desc-row">
                    <span className="image-desc-badge">{idx + 1}</span>
                    <input
                      className="image-desc-input"
                      type="text"
                      placeholder={`Description for image ${idx + 1}`}
                      value={img.description}
                      onChange={(e) => updateImageDesc(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {errors.images && <p className="field-error">{errors.images}</p>}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="discard-btn" onClick={handleDiscard}>
              Discard Draft
            </button>
            <button
              type="submit"
              disabled={nameStatus === "taken"}
              className="submit-btn"
            >
              Curate Product
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>auto_awesome</span>
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
        <div className="confirm-content">
          <div className="confirm-preview">
            {images.length > 0 && (
              <img className="confirm-preview-img" src={images[0].preview} alt="Preview" />
            )}
            <div className="confirm-preview-info">
              <h4 className="confirm-preview-name">{form.productName}</h4>
              <p className="confirm-preview-category">{selectedCategory?.CategoryName || "—"}</p>
            </div>
          </div>
          <div className="confirm-grid">
            <div>
              <span className="confirm-label">Price: </span>
              <span className="confirm-value">${parseFloat(form.price || 0).toFixed(2)}</span>
            </div>
            {form.oldPrice && (
              <div>
                <span className="confirm-label">Old Price: </span>
                <span className="confirm-value line-through">${parseFloat(form.oldPrice).toFixed(2)}</span>
              </div>
            )}
            <div>
              <span className="confirm-label">Quantity: </span>
              <span className="confirm-value">{form.quantity}</span>
            </div>
            <div>
              <span className="confirm-label">Images: </span>
              <span className="confirm-value">{images.length}</span>
            </div>
          </div>
          {uploadProgress && (
            <div className="upload-progress">
              <p className="upload-progress-text">{uploadProgress}</p>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" />
              </div>
            </div>
          )}
        </div>
      </ConfirmModal>

      {/* React Router navigation blocker */}
      {blocker.state === "blocked" && (
        <div className="nav-blocker-overlay">
          <div className="nav-blocker-card">
            <h3 className="nav-blocker-title">Unsaved Changes</h3>
            <p className="nav-blocker-message">
              You have unsaved changes. Are you sure you want to leave this page?
            </p>
            <div className="nav-blocker-actions">
              <button type="button" className="btn-cancel-text" onClick={() => blocker.reset()}>
                Stay
              </button>
              <button
                type="button"
                className="btn-leave"
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
