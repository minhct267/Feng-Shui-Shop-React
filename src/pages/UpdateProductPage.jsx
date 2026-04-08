import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import {
  checkProductName,
  fetchAdminProductDetail,
  fetchCategories,
  fetchPromotions,
  updateProduct,
} from "../services/api";

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

function validateForm(form, totalImageCount, nameStatus) {
  const errors = {};
  const name = form.productName.trim();
  if (!name) errors.productName = "Product name is required.";
  else if (name.length > 100)
    errors.productName = "Product name must be at most 100 characters.";
  else if (nameStatus === "taken")
    errors.productName = "A product with this name already exists.";

  if (!form.categoryId) errors.categoryId = "Please select a category.";

  const price = parseFloat(form.price);
  if (!form.price || isNaN(price) || price <= 0)
    errors.price = "Price must be a positive number.";

  if (form.oldPrice) {
    const old = parseFloat(form.oldPrice);
    if (isNaN(old) || old <= 0)
      errors.oldPrice = "Old price must be a positive number.";
    else if (!isNaN(price) && old <= price)
      errors.oldPrice = "Old price must be greater than current price.";
  }

  const qty = parseInt(form.quantity, 10);
  if (form.quantity === "" || isNaN(qty) || qty < 0)
    errors.quantity = "Quantity must be zero or a positive integer.";

  if (form.shortDescription && form.shortDescription.length > 255)
    errors.shortDescription = "Short description must be at most 255 characters.";

  if (totalImageCount === 0)
    errors.images = "At least one product image is required.";

  return errors;
}

export default function UpdateProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({
    productName: "",
    price: "",
    oldPrice: "",
    shortDescription: "",
    detailedDescription: "",
    quantity: "",
    categoryId: "",
    promotionId: "",
  });
  const [originalForm, setOriginalForm] = useState(null);

  const [existingImages, setExistingImages] = useState([]);
  const [originalExistingImages, setOriginalExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState(new Set());
  const [newImages, setNewImages] = useState([]);

  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [nameStatus, setNameStatus] = useState("idle");

  const fileInputRef = useRef(null);
  const nameCheckRef = useRef(null);
  const nameCheckAbortRef = useRef(null);
  const originalNameRef = useRef("");

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchPromotions().then(setPromotions).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    fetchAdminProductDetail(productId)
      .then((data) => {
        if (cancelled) return;

        const formData = {
          productName: data.ProductName || "",
          price: data.Price != null ? String(data.Price) : "",
          oldPrice: data.OldPrice != null ? String(data.OldPrice) : "",
          shortDescription: data.ShortDescription || "",
          detailedDescription: data.DetailedDescription || "",
          quantity: String(data.Quantity ?? ""),
          categoryId: data.CategoryId != null ? String(data.CategoryId) : "",
          promotionId: data.PromotionId != null ? String(data.PromotionId) : "",
        };

        setForm(formData);
        setOriginalForm(formData);
        originalNameRef.current = data.ProductName || "";

        const imgs = (data.Images || []).map((img) => ({
          ImageId: img.ImageId,
          ImageName: img.ImageName,
          ImageDescription: img.ImageDescription || "",
          ImageUrl: img.ImageUrl,
        }));
        setExistingImages(imgs);
        setOriginalExistingImages(imgs);
        setDeletedImageIds(new Set());
        setNewImages([]);
        setDirty(false);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Failed to load product.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    const name = form.productName.trim();
    if (!name) {
      setNameStatus("idle");
      return;
    }

    if (name === originalNameRef.current) {
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
        const data = await checkProductName(name, productId);
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
  }, [form.productName, productId]);

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

  const visibleExisting = existingImages.filter(
    (img) => !deletedImageIds.has(img.ImageId)
  );
  const allDisplayImages = [
    ...visibleExisting.map((img) => ({
      type: "existing",
      id: img.ImageId,
      src: img.ImageUrl,
      description: img.ImageDescription,
      name: img.ImageName,
    })),
    ...newImages.map((img, idx) => ({
      type: "new",
      idx,
      src: img.preview,
      description: img.description,
      file: img.file,
    })),
  ];

  function removeDisplayImage(displayIdx) {
    const item = allDisplayImages[displayIdx];
    if (item.type === "existing") {
      setDeletedImageIds((prev) => new Set(prev).add(item.id));
    } else {
      setNewImages((prev) => {
        const next = [...prev];
        URL.revokeObjectURL(next[item.idx].preview);
        next.splice(item.idx, 1);
        return next;
      });
    }
    setDirty(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
  }

  function addFiles(fileList) {
    const currentTotal = allDisplayImages.length;
    const added = [];
    for (const file of fileList) {
      if (currentTotal + added.length >= MAX_IMAGES) break;
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      added.push({ file, preview: URL.createObjectURL(file), description: "" });
    }
    if (added.length > 0) {
      setNewImages((prev) => [...prev, ...added]);
      setDirty(true);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
    }
  }

  function updateNewImageDesc(newIdx, desc) {
    setNewImages((prev) => {
      const next = [...prev];
      next[newIdx] = { ...next[newIdx], description: desc };
      return next;
    });
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

  function handleReset() {
    if (!originalForm) return;
    setForm({ ...originalForm });
    setExistingImages([...originalExistingImages]);
    setDeletedImageIds(new Set());
    setNewImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [];
    });
    setErrors({});
    setDirty(false);
    setNameStatus("idle");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateForm(form, allDisplayImages.length, nameStatus);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSubmitError("");
    setShowConfirm(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError("");
    setUploadProgress("Preparing update...");

    try {
      const fd = new FormData();
      fd.append("product_name", form.productName.trim());
      fd.append("price", form.price);
      if (form.oldPrice) fd.append("old_price", form.oldPrice);
      if (form.shortDescription)
        fd.append("short_description", form.shortDescription);
      if (form.detailedDescription)
        fd.append("detailed_description", form.detailedDescription);
      fd.append("quantity", form.quantity);
      fd.append("category_id", form.categoryId);
      if (form.promotionId) fd.append("promotion_id", form.promotionId);

      if (deletedImageIds.size > 0) {
        fd.append("deleted_image_ids", JSON.stringify([...deletedImageIds]));
      }

      if (newImages.length > 0) {
        const descs = newImages.map((img) => img.description || "");
        fd.append("new_image_descriptions", JSON.stringify(descs));
        for (const img of newImages) {
          fd.append("images", img.file);
        }
        setUploadProgress(
          `Uploading ${newImages.length} new image${newImages.length > 1 ? "s" : ""}...`
        );
      }

      await updateProduct(productId, fd);

      setSubmitSuccess(true);
      setDirty(false);

      setTimeout(() => navigate("/admin/products", { replace: true }), 2000);
    } catch (err) {
      setSubmitError(
        err.message || "An error occurred while updating the product."
      );
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }

  const selectedCategory = categories.find(
    (c) => String(c.CategoryId) === String(form.categoryId)
  );

  const previewSrc =
    allDisplayImages.length > 0 ? allDisplayImages[0].src : null;

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-inner">
          <span className="material-symbols-outlined animate-spin">
            progress_activity
          </span>
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-error">
        <span className="material-symbols-outlined page-error-icon">error</span>
        <p>{loadError}</p>
        <Link to="/admin/products" className="page-error-link">
          Back to Product Management
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-form-container">
      {/* Back link */}
      <Link to="/admin/products" className="btn-back-link">
        <span className="material-symbols-outlined">arrow_back</span>
        <span>Back to Product Management</span>
      </Link>

      {/* Live Preview Card */}
      <div className="live-preview">
        <div className="live-preview-thumb">
          {previewSrc ? (
            <img alt="Preview" src={previewSrc} />
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
          <h1>Update Product</h1>
          <p>
            Adjust the vibrational properties and details of this product.
          </p>
        </header>

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
              {errors.categoryId && (
                <p className="field-error">{errors.categoryId}</p>
              )}
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
                  <span
                    className="material-symbols-outlined name-status-icon available"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    check_circle
                  </span>
                )}
                {nameStatus === "taken" && (
                  <span
                    className="material-symbols-outlined name-status-icon taken"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    error
                  </span>
                )}
              </div>
              <div className="name-status-row">
                {nameStatus === "available" && (
                  <span className="name-status-msg available">
                    Name is available
                  </span>
                )}
                {nameStatus === "taken" && (
                  <span className="name-status-msg taken">
                    A product with this name already exists
                  </span>
                )}
                {nameStatus !== "available" && nameStatus !== "taken" && (
                  <span />
                )}
                {form.productName && (
                  <span className="name-counter">
                    {form.productName.length}/100
                  </span>
                )}
              </div>
              {errors.productName && (
                <p className="field-error">{errors.productName}</p>
              )}
            </div>

            {/* Price */}
            <div className="form-group">
              <label className="form-label">Price (AUD) *</label>
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
              <label className="form-label">Old Price (AUD)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Original price before discount"
                value={form.oldPrice}
                onChange={(e) => updateField("oldPrice", e.target.value)}
              />
              {errors.oldPrice && (
                <p className="field-error">{errors.oldPrice}</p>
              )}
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
              {errors.quantity && (
                <p className="field-error">{errors.quantity}</p>
              )}
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
                <span className="char-counter">
                  {form.shortDescription.length}/255
                </span>
              )}
              {errors.shortDescription && (
                <p className="field-error">{errors.shortDescription}</p>
              )}
            </div>

            {/* Detailed Description */}
            <div className="form-group full-width">
              <label className="form-label">Detailed Description</label>
              <div className="editor-container">
                <textarea
                  className="editor-textarea"
                  placeholder="Describe the energy, aura, origin, and spiritual properties of the product..."
                  value={form.detailedDescription}
                  onChange={(e) =>
                    updateField("detailedDescription", e.target.value)
                  }
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
              {allDisplayImages.length < MAX_IMAGES && (
                <div
                  className="dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDropZone}
                  onDragOver={handleDropZoneDragOver}
                >
                  <span className="material-symbols-outlined dropzone-icon">
                    add_a_photo
                  </span>
                  <p className="dropzone-label">
                    Drag and drop or click to browse
                  </p>
                  <p className="dropzone-hint">
                    JPEG, PNG, WebP &middot; Max 5 MB &middot; Up to{" "}
                    {MAX_IMAGES} images
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
              )}

              {/* Image Previews - unified gallery */}
              {allDisplayImages.map((item, idx) => (
                <div
                  key={
                    item.type === "existing" ? `ex-${item.id}` : `new-${item.idx}`
                  }
                  className="image-card"
                >
                  <img
                    alt={item.description || `Image ${idx + 1}`}
                    src={item.src}
                  />

                  {/* Badge */}
                  <div className="image-badge-row">
                    <div className="image-badge">{idx + 1}</div>
                    {item.type === "existing" && (
                      <span className="image-type-tag saved">Saved</span>
                    )}
                    {item.type === "new" && (
                      <span className="image-type-tag new">New</span>
                    )}
                  </div>

                  {/* Hover overlay with delete */}
                  <div className="image-hover-overlay">
                    <button
                      type="button"
                      className="image-delete-btn"
                      onClick={() => removeDisplayImage(idx)}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {allDisplayImages.length > 0 && (
              <p className="imagery-helper-text">
                The first image will be used as the product thumbnail.
                {deletedImageIds.size > 0 && (
                  <span className="deleted-images-warning">
                    {deletedImageIds.size} image
                    {deletedImageIds.size > 1 ? "s" : ""} marked for removal.
                  </span>
                )}
              </p>
            )}

            {/* New image descriptions */}
            {newImages.length > 0 && (
              <div className="image-desc-list">
                <p className="image-desc-title">
                  New Image Descriptions (optional)
                </p>
                {newImages.map((img, idx) => (
                  <div key={idx} className="image-desc-row">
                    <span className="image-desc-badge new">+{idx + 1}</span>
                    <input
                      className="image-desc-input"
                      type="text"
                      placeholder={`Description for new image ${idx + 1}`}
                      value={img.description}
                      onChange={(e) => updateNewImageDesc(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {errors.images && <p className="field-error">{errors.images}</p>}
          </div>

          {/* Actions: Cancel / Reset / Update */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel-text"
              onClick={() => navigate("/admin/products")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={handleReset}
              disabled={!dirty}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={nameStatus === "taken"}
              className="submit-btn"
            >
              Update Product
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                auto_awesome
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirm}
        title="Confirm Product Update"
        confirmLabel="Confirm & Update"
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
        successMessage="Product updated successfully!"
        error={submitError}
      >
        <div className="confirm-content">
          <div className="confirm-preview">
            {previewSrc && (
              <img className="confirm-preview-img" src={previewSrc} alt="Preview" />
            )}
            <div className="confirm-preview-info">
              <h4 className="confirm-preview-name">{form.productName}</h4>
              <p className="confirm-preview-category">
                {selectedCategory?.CategoryName || "\u2014"}
              </p>
            </div>
          </div>
          <div className="confirm-grid">
            <div>
              <span className="confirm-label">Price: </span>
              <span className="confirm-value">
                ${parseFloat(form.price || 0).toFixed(2)}
              </span>
            </div>
            {form.oldPrice && (
              <div>
                <span className="confirm-label">Old Price: </span>
                <span className="confirm-value line-through">
                  ${parseFloat(form.oldPrice).toFixed(2)}
                </span>
              </div>
            )}
            <div>
              <span className="confirm-label">Quantity: </span>
              <span className="confirm-value">{form.quantity}</span>
            </div>
            <div>
              <span className="confirm-label">Images: </span>
              <span className="confirm-value">{allDisplayImages.length}</span>
            </div>
          </div>
          {(deletedImageIds.size > 0 || newImages.length > 0) && (
            <div className="confirm-changes">
              {deletedImageIds.size > 0 && (
                <p>
                  <span className="removed-count">{deletedImageIds.size}</span>{" "}
                  image{deletedImageIds.size > 1 ? "s" : ""} will be removed
                </p>
              )}
              {newImages.length > 0 && (
                <p>
                  <span className="added-count">{newImages.length}</span>{" "}
                  new image{newImages.length > 1 ? "s" : ""} will be uploaded
                </p>
              )}
            </div>
          )}
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
              You have unsaved changes. Are you sure you want to leave this
              page?
            </p>
            <div className="nav-blocker-actions">
              <button
                type="button"
                className="btn-cancel-text"
                onClick={() => blocker.reset()}
              >
                Stay
              </button>
              <button
                type="button"
                className="btn-leave"
                onClick={() => blocker.proceed()}
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
