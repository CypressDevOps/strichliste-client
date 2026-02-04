// src/app/CorrectionModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Transaction } from '../domain/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { removeTxId: string }) => void;
  transactions?: Transaction[];
  initialSelectedTxId?: string | null;
}

export const CorrectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  transactions = [],
  initialSelectedTxId = null,
}) => {
  const [selectedRemoveId, setSelectedRemoveId] = useState<string>('');
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset + Vorauswahl
    timerRef.current = window.setTimeout(() => {
      setSelectedRemoveId(initialSelectedTxId ?? '');
      selectRef.current?.focus();
    }, 0);

    // Scroll verhindern
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, initialSelectedTxId]);

  const handleConfirm = () => {
    if (!selectedRemoveId) return;
    onConfirm({ removeTxId: selectedRemoveId });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-[520px] max-w-[95%] shadow-lg'>
        <h2 className='text-xl text-blue-950 font-semibold mb-3'>Korrektur</h2>

        <p className='text-sm text-gray-600 mb-4'>
          Wähle einen Eintrag aus, der entfernt werden soll.
        </p>

        <div className='mb-3'>
          <label className='block text-sm text-gray-700 mb-1'>Transaktion auswählen</label>

          <select
            ref={selectRef}
            value={selectedRemoveId}
            onChange={(e) => setSelectedRemoveId(e.target.value)}
            className='w-full p-2 rounded border bg-white text-blue-950'
          >
            <option value=''>-- Bitte auswählen --</option>

            {transactions.map((t, idx) => {
              const id = t.id ?? '';
              const label = `${new Date(t.date).toLocaleDateString()} • ${
                t.description
              } • ${t.sum > 0 ? '+' : ''}${t.sum.toFixed(2).replace('.', ',')} €`;

              return (
                <option key={id || `tmp-${idx}`} value={id} disabled={!id}>
                  {label}
                  {!id ? ' (keine ID – nicht löschbar)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div className='flex justify-end gap-2 mt-4'>
          <button onClick={onClose} className='px-4 py-2 bg-gray-700 rounded hover:bg-gray-800'>
            Abbrechen
          </button>

          <button
            onClick={handleConfirm}
            disabled={!selectedRemoveId}
            className={`px-4 py-2 bg-red-700 rounded hover:bg-red-800 ${
              selectedRemoveId ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
            }`}
          >
            Eintrag löschen
          </button>
        </div>
      </div>
    </div>
  );
};
