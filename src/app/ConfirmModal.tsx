// src/app/ConfirmModal.tsx
import React, { useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title = 'Bestätigung',
  message,
  confirmLabel = 'Löschen',
  cancelLabel = 'Abbrechen',
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fokus auf den Bestätigen-Button setzen
      confirmRef.current?.focus();
      // Scroll verhindern
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Escape zum Schließen
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      window.addEventListener('keydown', onKey);

      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      role='dialog'
      aria-modal='true'
      aria-labelledby='confirm-modal-title'
      aria-describedby='confirm-modal-desc'
    >
      <div ref={dialogRef} className='bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg'>
        <h3 id='confirm-modal-title' className='text-lg font-semibold text-blue-950 mb-2'>
          {title}
        </h3>

        <p id='confirm-modal-desc' className='text-sm text-gray-700'>
          {message}
        </p>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            onClick={onCancel}
            className='px-4 py-2 bg-gray-700 rounded hover:bg-gray-800'
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className='px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900'
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
