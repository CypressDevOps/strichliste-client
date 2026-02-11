// src/app/TransactionModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { DeckelUIState } from '../domain/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  onConfirm: (amount: number, deckelId?: string) => void;
  presets?: number[]; // z. B. [5,10,20,50]
  currency?: string; // z. B. '€'
  deckelList?: DeckelUIState[];
  selectedDeckelId: string | null;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onGoBack,
  onConfirm,
  presets = [5, 10, 20, 50],
  currency = '€',
  deckelList,
  selectedDeckelId,
}) => {
  // amount als string speichern, Parsing erfolgt beim Bestätigen
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [internalSelectedDeckelId, setInternalSelectedDeckelId] = useState<string | null>(
    selectedDeckelId
  );
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
    // Safe integer check
    if (parsed * 100 > Number.MAX_SAFE_INTEGER) {
      setError('Betrag ist zu groß.');
      return;
    }
    onConfirm(Number(parsed), internalSelectedDeckelId ?? undefined);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  // Determine if we need to show selection mode
  const needsSelection = !internalSelectedDeckelId && deckelList && deckelList.length > 0;
  const availableDeckel =
    deckelList?.filter((d) => d.status === 'OFFEN' || d.status === 'GONE') ?? [];

  // Selection Mode
  if (needsSelection) {
    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
        <div className='bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg'>
          <h2 className='text-lg font-semibold text-blue-950 mb-4'>Deckel auswählen</h2>

          <p className='text-sm text-gray-700 mb-4'>Wähle einen Gast für die Einzahlung aus:</p>

          {availableDeckel.length === 0 ? (
            <p className='text-sm text-gray-600 italic mb-6'>Keine Gäste verfügbar</p>
          ) : (
            <div className='max-h-96 overflow-y-auto mb-6'>
              <div className='flex flex-col gap-2'>
                {availableDeckel.map((deckel) => {
                  const sum = deckel.transactions?.reduce((acc, t) => acc + (t.sum ?? 0), 0) ?? 0;
                  return (
                    <button
                      key={deckel.id}
                      onClick={() => setInternalSelectedDeckelId(deckel.id)}
                      className='w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-left flex justify-between items-center'
                    >
                      <span>{deckel.name}</span>
                      <span className={sum < 0 ? 'text-red-200' : 'text-green-200'}>
                        {sum.toFixed(2)} €
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => (onGoBack ? onGoBack() : onClose())}
            className='w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold'
          >
            {onGoBack ? '< Zurück' : 'Abbrechen'}
          </button>
        </div>
      </div>
    );
  }

  const currentDeckel = deckelList?.find((d) => d.id === internalSelectedDeckelId);

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-96 shadow-lg'>
        <h2 className='text-xl text-blue-950 font-semibold mb-4'>
          Einzahlung{currentDeckel ? ` - ${currentDeckel.name}` : ''}
        </h2>

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
            maxLength={13}
            onChange={(e) => {
              let v = e.target.value;
              // Entferne alle Zeichen außer Ziffern und Komma
              v = v.replace(/[^\d,]/g, '');

              // Limit length to prevent overflow
              if (v.length > 13) {
                v = v.substring(0, 13);
              }

              // Erlaube nur ein Komma
              const parts = v.split(',');
              if (parts.length > 2) {
                v = parts[0] + ',' + parts.slice(1).join('');
              }

              // Begrenze Nachkommastellen auf 2
              if (parts.length === 2 && parts[1].length > 2) {
                v = parts[0] + ',' + parts[1].substring(0, 2);
              }

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
            onClick={() => {
              if (!selectedDeckelId && deckelList && deckelList.length > 0) {
                setInternalSelectedDeckelId(null);
              } else if (onGoBack) {
                onGoBack();
              } else {
                onClose();
              }
            }}
            className='px-4 py-2 bg-gray-700 rounded hover:bg-gray-800'
          >
            {!selectedDeckelId && deckelList && deckelList.length > 0
              ? '< Zur Auswahl'
              : onGoBack
                ? 'Zurück'
                : 'Abbrechen'}
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
