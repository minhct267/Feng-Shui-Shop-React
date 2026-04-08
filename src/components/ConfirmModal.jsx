import { useEffect, useRef } from "react";

export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  loadingMessage = "Processing...",
  success = false,
  successMessage = "Success!",
  successSubMessage = "",
  error = "",
  variant = "primary",
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape" && !loading) onCancel?.();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current && !loading) onCancel?.();
  }

  if (success) {
    return (
      <div ref={overlayRef} className="modal-overlay">
        <div className="modal-success-card">
          <div className="modal-success-icon">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              check_circle
            </span>
          </div>
          <h3 className="modal-success-title">{successMessage}</h3>
          {successSubMessage && (
            <p className="modal-success-sub">{successSubMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="modal-card">
        <h3 className="modal-title">{title}</h3>

        <div className="modal-body">{children}</div>

        {error && <div className="modal-error">{error}</div>}

        {loading && (
          <div className="modal-loading">
            <span
              className={`material-symbols-outlined animate-spin ${
                variant === "destructive" ? "destructive" : "primary"
              }`}
            >
              progress_activity
            </span>
            <span>{loadingMessage}</span>
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="modal-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`modal-confirm-btn${variant === "destructive" ? " destructive" : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: "14px" }}>
                  progress_activity
                </span>
                {loadingMessage}
              </>
            ) : (
              <>
                {confirmLabel}
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  {variant === "destructive" ? "delete_forever" : "auto_awesome"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
