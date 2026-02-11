import React, { useState } from 'react';
import { DeckelUIState } from '../domain/models';

type Props = {
  isOpen: boolean;
  deckelList: DeckelUIState[];
  selectedDeckelId: string | null;
  onClose: () => void;
  onGoBack?: () => void;
  onConfirm: (sourceId: string, targetId: string, onlyNegative?: boolean) => void;
};

export const DeckeltransferModal: React.FC<Props> = ({
  isOpen,
  deckelList,
  onClose,
  onGoBack,
  onConfirm,
}) => {
  const [sourceDeckelId, setSourceDeckelId] = useState<string | null>(null);
  const [targetDeckelId, setTargetDeckelId] = useState<string | null>(null);
  const [warnModal, setWarnModal] = useState<'balance' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Prüfe ob es mindestens 2 Deckel mit Status OFFEN oder GONE gibt (BEZAHLT ignorieren)
  const transferableDeckel = deckelList.filter((d) => d.status !== 'BEZAHLT');
  if (transferableDeckel.length < 2) {
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
        role='dialog'
        aria-modal='true'
      >
        <div className='bg-white rounded-lg w-11/12 max-w-sm p-6 shadow-lg'>
          <h2 className='text-lg font-semibold text-orange-600 mb-4'>
            ℹ️ Übertragung nicht möglich
          </h2>
          <p className='text-gray-700 mb-6'>Kein weiterer Gast zum Übertragen vorhanden.</p>
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => (onGoBack ? onGoBack() : onClose())}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold'
            >
              {onGoBack ? 'Zurück' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sourceDeckel = deckelList.find((d) => d.id === sourceDeckelId);

  // Berechne Gesamtergebnis des source-Deckels
  const sourceTotalBalance = sourceDeckel
    ? (sourceDeckel.transactions ?? []).reduce((s, t) => s + t.sum, 0)
    : 0;

  // Zähle positive und negative Transaktionen
  const negativeTransactions = sourceDeckel?.transactions?.filter((t) => t.sum < 0) ?? [];
  const hasPositiveTransactions = sourceDeckel?.transactions?.some((t) => t.sum > 0) ?? false;

  // Nur Deckel mit Status OFFEN oder GONE und Schulden (Gesamtergebnis < 0) als Source-Optionen
  const availableSources = deckelList.filter((d) => {
    if (d.status === 'BEZAHLT') return false;
    // OFFEN und GONE können als Source verwendet werden
    if (d.status !== 'OFFEN' && d.status !== 'GONE') return false;
    const balance = (d.transactions ?? []).reduce((s, t) => s + t.sum, 0);
    return balance < 0;
  });

  // Prüfe ob es überhaupt Deckel mit Schulden gibt
  if (availableSources.length === 0) {
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
        role='dialog'
        aria-modal='true'
      >
        <div className='bg-white rounded-lg w-11/12 max-w-sm p-6 shadow-lg'>
          <h2 className='text-lg font-semibold text-orange-600 mb-4'>
            ℹ️ Übertragung nicht möglich
          </h2>
          <p className='text-gray-700 mb-6'>
            Es gibt keinen Gast mit Schulden, der übertragen werden kann.
          </p>
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => (onGoBack ? onGoBack() : onClose())}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold'
            >
              {onGoBack ? 'Zurück' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Deckel mit Status OFFEN oder GONE als Target-Optionen, außer Source selbst
  const availableTargets = sourceDeckel
    ? deckelList.filter(
        (d) => d.id !== sourceDeckelId && (d.status === 'OFFEN' || d.status === 'GONE')
      )
    : [];

  const targetDeckel = availableTargets.find((d) => d.id === targetDeckelId);

  const handleConfirm = () => {
    if (!sourceDeckelId || !targetDeckelId || isProcessing) return;

    // Prüfe ob Gesamtergebnis >= 0
    if (sourceTotalBalance >= 0) {
      setWarnModal('balance');
      return;
    }

    setIsProcessing(true);

    try {
      // Wenn positive Transaktionen vorhanden sind, nur negative übertragen (kein Guthaben)
      const onlyNegative = hasPositiveTransactions;

      onConfirm(sourceDeckelId, targetDeckelId, onlyNegative);
      setSourceDeckelId(null);
      setTargetDeckelId(null);
      onClose();
    } finally {
      // Reset processing state even if onConfirm throws
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  // Warn Modal für Gesamtergebnis >= 0
  if (warnModal === 'balance') {
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
        role='dialog'
        aria-modal='true'
      >
        <div className='bg-white rounded-lg w-11/12 max-w-sm p-6 shadow-lg'>
          <h2 className='text-lg font-semibold text-red-600 mb-4'>⚠️ Deckel nicht übertragbar</h2>
          <p className='text-gray-700 mb-6'>
            Ein Deckel mit Nullsaldo oder Guthaben (Gesamtergebnis ≥ 0 €) kann nicht übertragen
            werden. Zahlungspflichtige Deckel können nur übertragen werden, wenn sie Schulden haben.
          </p>
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => setWarnModal(null)}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold'
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      role='dialog'
      aria-modal='true'
      aria-labelledby='transfer-title'
    >
      <div className='bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg'>
        <h2 id='transfer-title' className='text-lg font-semibold text-blue-950 mb-4'>
          Deckel übertragen
        </h2>

        {/* Source Selection */}
        <div className='mb-6'>
          <label className='text-sm font-semibold text-gray-700 mb-2 block'>
            Von: Gast auswählen
          </label>
          {availableSources.length === 0 ? (
            <p className='text-sm text-gray-600 italic'>Keine Gäste vorhanden</p>
          ) : (
            <select
              value={sourceDeckelId ?? ''}
              onChange={(e) => {
                setSourceDeckelId(e.target.value || null);
                setTargetDeckelId(null);
              }}
              className='w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900'
            >
              <option value=''>-- Gast auswählen --</option>
              {availableSources.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Source Details */}
        {sourceDeckel && (
          <div className='mb-6 p-3 bg-blue-50 rounded border border-blue-200'>
            <div className='text-sm text-gray-700 mb-2'>
              <strong>Details:</strong>
            </div>
            <div className='text-xs text-gray-600'>
              Produkte:{' '}
              {(sourceDeckel.transactions ?? []).map((t) => t.description).join(', ') || 'keine'}
            </div>
            <div className='text-xs text-gray-600 mt-1'>
              Gesamtergebnis:{' '}
              <span
                className={
                  sourceTotalBalance >= 0
                    ? 'text-red-600 font-semibold'
                    : 'text-green-600 font-semibold'
                }
              >
                {sourceTotalBalance.toFixed(2)} €
              </span>
            </div>
            {hasPositiveTransactions && (
              <div className='text-xs text-amber-600 mt-2 italic'>
                ℹ️ Nur Schuldenbeträge werden übertragen, Guthaben bleibt beim Gast.
              </div>
            )}
          </div>
        )}

        {/* Target Selection */}
        {sourceDeckel && (
          <div className='mb-6'>
            <label className='text-sm font-semibold text-gray-700 mb-2 block'>
              An: Gast auswählen
            </label>
            {availableTargets.length === 0 ? (
              <p className='text-sm text-gray-600 italic'>Keine anderen Gäste vorhanden</p>
            ) : (
              <select
                value={targetDeckelId ?? ''}
                onChange={(e) => setTargetDeckelId(e.target.value || null)}
                className='w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900'
              >
                <option value=''>-- Gast auswählen --</option>
                {availableTargets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Target Preview */}
        {targetDeckel && sourceDeckel && (
          <div className='mb-6 p-3 bg-green-50 rounded border border-green-200'>
            <div className='text-sm text-gray-700 mb-2'>
              <strong>
                Saldo nach Übertragung{hasPositiveTransactions ? ' (nur Schulden)' : ''}:
              </strong>
            </div>
            <div className='text-base font-semibold text-green-900'>
              {(
                (targetDeckel.transactions ?? []).reduce((s, t) => s + t.sum, 0) +
                (hasPositiveTransactions
                  ? negativeTransactions.reduce((s, t) => s + t.sum, 0)
                  : (sourceDeckel.transactions ?? []).reduce((s, t) => s + t.sum, 0))
              ).toFixed(2)}{' '}
              €
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className='flex gap-3 justify-end'>
          <button
            onClick={() => (onGoBack ? onGoBack() : onClose())}
            className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold'
          >
            {onGoBack ? 'Zurück' : 'Abbrechen'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!sourceDeckelId || !targetDeckelId || isProcessing}
            className={`px-6 py-2 rounded font-semibold text-white transition ${
              sourceDeckelId && targetDeckelId && !isProcessing
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-green-600 cursor-not-allowed opacity-50'
            }`}
          >
            {isProcessing ? 'Übertrage...' : 'Übertragen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckeltransferModal;
