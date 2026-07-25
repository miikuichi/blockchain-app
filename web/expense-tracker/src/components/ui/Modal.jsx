import { useEffect } from "react";
import Button from "./Button";

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "gold",
  cancelVariant = "ghost",
  disableConfirm = false,
  isConfirming = false,
  hideFooter = false,
  closeOnOverlay = true,
  closeOnEscape = true,
  width = "md",
  footer,
}) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return undefined;
    }

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (!closeOnOverlay) {
      return;
    }

    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-container modal-width-${width}`} role="dialog" aria-modal="true" aria-label={title || "Modal"}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" type="button" onClick={() => onClose?.()} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="modal-content">{children}</div>

        {!hideFooter && (
          <div className="modal-footer">
            {footer || (
              <>
                <Button variant={cancelVariant} onClick={() => (onCancel ? onCancel() : onClose?.())}>
                  {cancelText}
                </Button>
                <Button
                  variant={confirmVariant}
                  onClick={() => onConfirm?.()}
                  disabled={disableConfirm || isConfirming}
                >
                  {isConfirming ? "Processing..." : confirmText}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}