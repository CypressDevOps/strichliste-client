// src/app/EmergencyOverrideModal.tsx
import React, { useState } from 'react';

interface EmergencyOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentState: boolean;
}

export const EmergencyOverrideModal: React.FC<EmergencyOverrideModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentState,
}) => {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmText.toLowerCase() === 'notfall') {
      onConfirm();
      setConfirmText('');
      onClose();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-11/12 max-w-md text-white'>
        <h2 className='text-2xl font-bold mb-4 text-yellow-400'>⚠️ Notfall-Modus</h2>

        <div className='mb-6'>
          <p className='mb-3'>
            Der <strong>Notfall-Modus</strong> deaktiviert alle Sicherheitssperren und ermöglicht
            das Bearbeiten von geschlossenen Abenden.
          </p>

          <div className='bg-yellow-900/30 border border-yellow-600 rounded p-3 mb-3'>
            <p className='text-sm text-yellow-200'>
              <strong>⚠️ Warnung:</strong> Nur in Ausnahmefällen verwenden! Änderungen nach
              Abschluss können zu Inkonsistenzen führen.
            </p>
          </div>

          <div className='mb-4'>
            <p className='text-sm text-gray-300 mb-2'>
              Aktueller Status:{' '}
              <span className={currentState ? 'text-green-400 font-bold' : 'text-gray-400'}>
                {currentState ? 'AKTIVIERT' : 'DEAKTIVIERT'}
              </span>
            </p>
          </div>

          {!currentState && (
            <div>
              <label className='block text-sm mb-2'>
                Gib <code className='bg-gray-700 px-2 py-1 rounded'>NOTFALL</code> ein, um zu
                bestätigen:
              </label>
              <input
                type='text'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className='w-full p-2 rounded bg-gray-700 border border-gray-600 text-white'
                placeholder='NOTFALL'
              />
            </div>
          )}
        </div>

        <div className='flex gap-3'>
          <button
            onClick={handleClose}
            className='flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition'
          >
            Abbrechen
          </button>
          {currentState ? (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className='flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 rounded transition font-semibold'
            >
              Deaktivieren
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={confirmText.toLowerCase() !== 'notfall'}
              className={`flex-1 px-4 py-2 rounded transition font-semibold ${
                confirmText.toLowerCase() === 'notfall'
                  ? 'bg-yellow-600 hover:bg-yellow-500 cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Aktivieren
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
