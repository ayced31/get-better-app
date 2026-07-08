import { create } from 'zustand';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  showAlert: (message: string, title?: string, onConfirm?: () => void) => void;
  showConfirm: (
    message: string,
    options?: {
      title?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ) => void;
  close: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  title: 'Notification',
  message: '',
  type: 'alert',
  confirmLabel: 'OK',
  cancelLabel: 'Cancel',
  onConfirm: null,
  onCancel: null,

  showAlert: (message, title = 'Notification', onConfirm) => {
    set({
      isOpen: true,
      message,
      title,
      type: 'alert',
      confirmLabel: 'OK',
      onConfirm: onConfirm || null,
      onCancel: null,
    });
  },

  showConfirm: (message, options = {}) => {
    set({
      isOpen: true,
      message,
      title: options.title || 'Are you sure?',
      type: 'confirm',
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: options.cancelLabel || 'Cancel',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
    });
  },

  close: () => {
    set({ isOpen: false });
  },
}));
