import React, { useState } from 'react';
import { DeckelUIState } from '../domain/models';

interface PayDeckelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  totalSum: number;
  onConfirm: (amount: number, deckelId?: string, moveToGone?: boolean) => void;
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
  const [pendingPayment, setPendingPayment] = useState<{ amount: number } | null>(null);

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

  // --- Rückgeld-Auswahl Modal ---
  if (pendingPayment) {
    const change = pendingPayment.amount - abs;
    return (
      <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50'>
        <div className='bg-gray-800 p-6 rounded-lg w-80 text-white'>
          <h2 className='text-xl font-bold mb-4'>Zahlungsart wählen</h2>

          <div className='mb-4 p-3 bg-gray-700 rounded'>
            <p className='text-sm text-gray-300'>
              Deckelbetrag: <span className='font-bold text-white'>{abs.toFixed(2)} €</span>
            </p>
            <p className='text-sm text-gray-300'>
              Gezahlter Betrag:{' '}
              <span className='font-bold text-white'>{pendingPayment.amount.toFixed(2)} €</span>
            </p>
            <p className='text-sm text-green-400 font-bold mt-2'>Rückgeld: {change.toFixed(2)} €</p>
          </div>

          <div className='flex flex-col gap-3'>
            <button
              className='bg-blue-700 hover:bg-blue-600 py-3 rounded font-semibold'
              onClick={() => {
                // Rückgeld: Exakt den Deckelbetrag zahlen
                onConfirm(abs, internalSelectedDeckelId ?? undefined);
                setPendingPayment(null);
              }}
            >
              Mit Rückgeld ({change.toFixed(2)} €)
            </button>

            <button
              className='bg-green-700 hover:bg-green-600 py-3 rounded font-semibold'
              onClick={() => {
                // Guthaben: Den vollen Betrag zahlen (erzeugt Guthaben) und Deckel nach GONE verschieben
                onConfirm(pendingPayment.amount, internalSelectedDeckelId ?? undefined, true);
                setPendingPayment(null);
              }}
            >
              Als Guthaben behalten
            </button>

            <button
              className='mt-2 text-gray-300 underline'
              onClick={() => setPendingPayment(null)}
            >
              Zurück
            </button>
          </div>
        </div>
      </div>
    );
  }

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

    // Limit total length to prevent overflow (max 10 digits + comma + 2 decimals = 13)
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }

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
    if (!amount || amount <= 0) {
      alert('Bitte einen gültigen Betrag größer 0 eingeben.');
      return;
    }
    if (amount > 200) {
      alert('Maximaler Betrag ist 200€.');
      return;
    }
    // Safe integer check (JavaScript limit)
    if (amount * 100 > Number.MAX_SAFE_INTEGER) {
      alert('Betrag ist zu groß.');
      return;
    }

    // Prüfe auf Überzahlung
    if (amount > abs) {
      setPendingPayment({ amount });
      return;
    }

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
          {suggestions.map((s) => (
            <button
              key={s.label}
              className='bg-green-700 hover:bg-green-600 py-2 rounded'
              onClick={() => {
                // "Passend" zahlt immer exakt den Betrag
                if (s.label === 'Passend') {
                  onConfirm(s.value, internalSelectedDeckelId ?? undefined);
                  return;
                }

                // Andere Beträge: Prüfe auf Überzahlung
                if (s.value > abs) {
                  setPendingPayment({ amount: s.value });
                  return;
                }

                onConfirm(s.value, internalSelectedDeckelId ?? undefined);
              }}
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
