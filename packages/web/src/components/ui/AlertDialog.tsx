import { useEffect } from 'react';
import { useAlertStore } from '../../stores/alert';
import { Button } from './Button';
import './AlertDialog.css';

export function AlertDialog() {
  const {
    isOpen,
    title,
    message,
    type,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    close,
  } = useAlertStore();

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (type === 'confirm' && onCancel) {
          onCancel();
        }
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, type, onCancel, close]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    close();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    close();
  };

  return (
    <div className="alert-overlay fade-in">
      <div className="alert-box scale-up" role="dialog" aria-modal="true">
        <div className="alert-box__header">
          <span className="alert-box__title">{title}</span>
        </div>
        <div className="alert-box__body">
          <p className="alert-box__message">{message}</p>
        </div>
        <div className="alert-box__footer">
          {type === 'confirm' && (
            <Button variant="secondary" onClick={handleCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button variant="primary" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
