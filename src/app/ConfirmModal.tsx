// src/app/ConfirmModal.tsx
import React, { useEffect, useRef } from 'react';

interface SecondaryAction {
  label: string;
  onClick: () => void;
}

interface Props {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  secondaryAction?: SecondaryAction; // optional: zeigt zusätzlichen Button links von Confirm
  showSavedInfo?: boolean; // neu: steuert Anzeige "Gespeicherte Information"
  confirmClassName?: string;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title = 'Bestätigung',
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  onConfirm,
  onCancel,
  secondaryAction,
  showSavedInfo = true,
  confirmClassName,
}) => {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      confirmRef.current?.focus();
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
        else if (e.key === 'Enter') onConfirm();
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

        {/* Optionaler Hinweis, kann per Prop deaktiviert werden */}
        {showSavedInfo}

        <div className='mt-6 flex justify-end gap-3'>
          <button
            onClick={onCancel}
            className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300'
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className='px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600'
            >
              {secondaryAction.label}
            </button>
          )}

          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 ${
              confirmClassName ?? 'bg-blue-600 text-white rounded hover:bg-blue-700'
            }`}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
