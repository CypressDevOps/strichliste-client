import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectEinzahlung: () => void;
  onSelectZahlen: () => void;
  onSelectUebertrag: () => void;
};

export const CashierModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectEinzahlung,
  onSelectZahlen,
  onSelectUebertrag,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      role='dialog'
      aria-modal='true'
      aria-labelledby='cashier-title'
    >
      <div className='bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg'>
        <h2 id='cashier-title' className='text-lg font-semibold text-blue-950 mb-4'>
          Kassieren
        </h2>

        <p className='text-sm text-gray-700 mb-6'>Was möchtest du tun?</p>

        <div className='flex flex-col gap-3'>
          <button
            onClick={() => {
              onSelectEinzahlung();
              onClose();
            }}
            className='w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-left'
          >
            Einzahlung
          </button>

          <button
            onClick={() => {
              onSelectZahlen();
              onClose();
            }}
            className='w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold text-left'
          >
            Deckel zahlen
          </button>

          <button
            onClick={() => {
              onSelectUebertrag();
              onClose();
            }}
            className='w-full px-4 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-800 hover:text-white-800 font-semibold text-left'
          >
            Deckel übertragen
          </button>

          <button
            onClick={onClose}
            className='w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold'
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierModal;
