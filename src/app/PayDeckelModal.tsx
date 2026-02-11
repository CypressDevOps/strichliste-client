import React, { useState } from 'react';
import { DeckelUIState } from '../domain/models';

interface PayDeckelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  totalSum: number;
  onConfirm: (amount: number, deckelId?: string) => void;
  deckelList?: DeckelUIState[];
  selectedDeckelId: string | null;
}

export const PayDeckelModal: React.FC<PayDeckelModalProps> = ({
  isOpen,
  onClose,
  onGoBack,
  totalSum,
  onConfirm,
  deckelList,
  selectedDeckelId,
}) => {
  const [custom, setCustom] = useState('');
  const [internalSelectedDeckelId, setInternalSelectedDeckelId] = useState<string | null>(
    selectedDeckelId
  );

  if (!isOpen) return null;

  // Determine if we need to show selection mode
  const needsSelection = !internalSelectedDeckelId && deckelList && deckelList.length > 0;
  const availableDeckel =
    deckelList?.filter((d) => {
      if (d.status !== 'OFFEN') return false;
      const sum = d.transactions?.reduce((acc, t) => acc + (t.sum ?? 0), 0) ?? 0;
      return sum < 0; // Nur Deckel mit Schulden
    }) ?? [];

  // Selection Mode
  if (needsSelection) {
    return (
      <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
        <div className='bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg'>
          <h2 className='text-lg font-semibold text-blue-950 mb-4'>Deckel auswählen</h2>

          <p className='text-sm text-gray-700 mb-4'>Wähle einen offenen Deckel zum Zahlen aus:</p>

          {availableDeckel.length === 0 ? (
            <p className='text-sm text-gray-600 italic mb-6'>
              Keine Deckel mit offenen Schulden vorhanden
            </p>
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
            {onGoBack ? 'Zurück' : 'Abbrechen'}
          </button>
        </div>
      </div>
    );
  }

  // Get the selected deckel for payment mode
  const currentDeckel = deckelList?.find((d) => d.id === internalSelectedDeckelId);
  const currentTotalSum = currentDeckel
    ? (currentDeckel.transactions?.reduce((acc, t) => acc + (t.sum ?? 0), 0) ?? 0)
    : totalSum;

  // Wenn Gesamtergebnis >= 0, kann nicht gezahlt werden
  if (currentTotalSum >= 0) {
    return (
      <div
        className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'
        role='dialog'
        aria-modal='true'
      >
        <div className='bg-white rounded-lg w-11/12 max-w-sm p-6 shadow-lg'>
          <h2 className='text-lg font-semibold text-orange-600 mb-4'>⚠️ Nichts zu zahlen</h2>
          <p className='text-gray-700 mb-2'>
            {currentDeckel ? (
              <>
                <strong>{currentDeckel.name}</strong> hat ein Gesamtergebnis von{' '}
                <span className='font-semibold text-green-600'>{currentTotalSum.toFixed(2)} €</span>
                .
              </>
            ) : (
              <>Das Gesamtergebnis ist {currentTotalSum.toFixed(2)} €.</>
            )}
          </p>
          <p className='text-gray-700 mb-6'>
            {currentTotalSum === 0
              ? 'Der Deckel ist ausgeglichen.'
              : 'Der Gast hat Guthaben und muss nichts zahlen.'}
          </p>
          <div className='flex justify-end gap-3'>
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
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold'
            >
              {!selectedDeckelId && deckelList && deckelList.length > 0 ? 'Zurück' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const abs = Math.abs(currentTotalSum);

  // --- Vorschlagslogik ---
  let tierMin: number | null = null;
  if (abs > 0 && abs <= 5) tierMin = 5;
  else if (abs > 5 && abs <= 10) tierMin = 10;
  else if (abs > 10 && abs <= 20) tierMin = 20;
  else if (abs > 20 && abs <= 50) tierMin = 50;

  const suggestions: { label: string; value: number }[] = [
    { label: 'Passend', value: abs }, // Default
  ];

  if (tierMin !== null) {
    [5, 10, 20, 50]
      .filter((v) => v >= tierMin)
      .forEach((v) => suggestions.push({ label: `${v} €`, value: v }));
  }

  // --- Custom Input ---
  const handleCustomChange = (value: string) => {
    // Entferne alle Zeichen außer Ziffern und Komma
    let cleaned = value.replace(/[^\d,]/g, '');

    // Erlaube nur ein Komma
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      // Mehr als ein Komma - nehme nur erste zwei Teile
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }

    // Begrenze Nachkommastellen auf 2
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + ',' + parts[1].substring(0, 2);
    }

    setCustom(cleaned);
  };

  const handleCustomConfirm = () => {
    // Konvertiere Komma zu Punkt für Number()
    const amount = Number(custom.replace(',', '.'));
    if (!amount || amount <= 0 || amount > 200) return;
    onConfirm(amount, internalSelectedDeckelId ?? undefined);
  };

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-80 text-white'>
        <h2 className='text-xl font-bold mb-4'>
          Deckel zahlen{currentDeckel ? ` - ${currentDeckel.name}` : ''}
        </h2>

        {/* Vorschläge */}
        <div className='flex flex-col gap-3 mb-4'>
          {suggestions.map((s, index) => (
            <button
              key={s.label}
              className={`py-2 rounded ${
                index === 0
                  ? 'bg-green-900 border border-green-400'
                  : 'bg-green-700 hover:bg-green-600'
              }`}
              onClick={() => onConfirm(s.value, internalSelectedDeckelId ?? undefined)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Eigener Betrag */}
        <div className='mt-4'>
          <label className='block mb-1'>Eigener Betrag</label>
          <input
            type='text'
            value={custom}
            onChange={(e) => handleCustomChange(e.target.value)}
            className='w-full p-2 rounded bg-gray-700'
          />
          <button
            className='mt-3 bg-blue-700 hover:bg-blue-600 py-2 rounded w-full'
            onClick={handleCustomConfirm}
          >
            Bestätigen
          </button>
        </div>

        <button
          className='mt-4 text-gray-300 underline'
          onClick={() => {
            // If we came from internal selection (no pre-selected deckel), go back to selection
            if (!selectedDeckelId && deckelList && deckelList.length > 0) {
              setInternalSelectedDeckelId(null);
            } else if (onGoBack) {
              onGoBack();
            } else {
              onClose();
            }
          }}
        >
          {!selectedDeckelId && deckelList && deckelList.length > 0
            ? 'Zurück zur Auswahl'
            : onGoBack
              ? 'Zurück'
              : 'Abbrechen'}
        </button>
      </div>
    </div>
  );
};
