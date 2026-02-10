// src/app/TransactionModal.tsx
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  onConfirm: (amount: number) => void;
  presets?: number[]; // z. B. [5,10,20,50]
  currency?: string; // z. B. '€'
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onGoBack,
  onConfirm,
  presets = [5, 10, 20, 50],
  currency = '€',
}) => {
  // amount als string speichern, Parsing erfolgt beim Bestätigen
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Wenn Modal nicht offen ist, stelle sicher, dass kein Timer läuft
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // setState asynchron ausführen, um mögliche "cascading renders" zu vermeiden
    timerRef.current = window.setTimeout(() => {
      setAmount('');
      setError('');
      inputRef.current?.focus();
    }, 0);

    // Body overflow sperren und vorherigen Wert merken
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cleanup-Funktion
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const choosePreset = (value: number) => {
    setAmount(String(value));
    setError('');
    // Fokus auf Input, falls vorhanden
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleConfirm = () => {
    const parsed = parseFloat(String(amount).replace(',', '.'));
    if (!parsed || isNaN(parsed) || parsed <= 0) {
      setError('Bitte einen gültigen Betrag größer 0 eingeben.');
      return;
    }
    onConfirm(Number(parsed));
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-96 shadow-lg'>
        <h2 className='text-xl text-blue-950 font-semibold mb-4'>Einzahlung</h2>

        <div className='mb-3'>
          <div className='flex gap-2 flex-wrap'>
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => choosePreset(p)}
                className={`px-3 py-2 rounded border ${
                  amount === String(p) ? 'bg-green-600 text-white' : 'bg-white text-blue-950'
                }`}
                type='button'
              >
                {p}
                {currency}
              </button>
            ))}
          </div>
        </div>

        <label className='block text-blue-950 mb-2'>
          Manueller Betrag
          <input
            ref={inputRef}
            type='text'
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              // immer als string speichern; Parsing erfolgt beim Bestätigen
              setAmount(v);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            className='border text-blue-950 w-full p-2 mt-1 rounded'
            placeholder={`z. B. 7,50`}
            aria-label='Betrag'
          />
        </label>

        {error && <p className='text-red-700 text-sm mb-2'>{error}</p>}

        <div className='flex justify-end gap-2 mt-4'>
          <button
            onClick={() => (onGoBack ? onGoBack() : onClose())}
            className='px-4 py-2 bg-gray-700 rounded hover:bg-gray-800'
          >
            {onGoBack ? '< Zurück' : 'Abbrechen'}
          </button>
          <button
            onClick={handleConfirm}
            className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
          >
            Einzahlung bestätigen
          </button>
        </div>
      </div>
    </div>
  );
};
