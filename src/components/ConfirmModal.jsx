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
  success = false,
  successMessage = "Success!",
  error = "",
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
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4 text-center animate-[fadeIn_0.2s_ease-out]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-700 text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>
              check_circle
            </span>
          </div>
          <h3 className="text-2xl font-headline text-on-surface mb-2">{successMessage}</h3>
          <p className="text-on-surface-variant text-sm">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-[fadeIn_0.2s_ease-out]">
        <h3 className="text-2xl font-headline text-on-surface mb-6">{title}</h3>

        <div className="mb-8">{children}</div>

        {error && (
          <div className="mb-6 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-6 flex items-center gap-3 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            <span>Processing...</span>
          </div>
        )}

        <div className="flex justify-end gap-6">
          <button
            type="button"
            className="text-on-surface-variant font-label uppercase tracking-widest text-xs hover:text-on-background transition-colors disabled:opacity-40"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="bg-primary text-on-primary px-8 py-4 rounded-full font-label uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:bg-primary-container transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Uploading...
              </>
            ) : (
              <>
                {confirmLabel}
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
