import React, { useState } from 'react';

interface PayDeckelModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalSum: number;
  onConfirm: (amount: number) => void;
}

export const PayDeckelModal: React.FC<PayDeckelModalProps> = ({
  isOpen,
  onClose,
  totalSum,
  onConfirm,
}) => {
  const [custom, setCustom] = useState('');

  if (!isOpen) return null;

  const abs = Math.abs(totalSum);

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
    const cleaned = value.replace(/[^\d]/g, '');
    setCustom(cleaned);
  };

  const handleCustomConfirm = () => {
    const amount = Number(custom);
    if (!amount || amount <= 0 || amount > 200) return;
    onConfirm(amount);
  };

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center'>
      <div className='bg-gray-800 p-6 rounded-lg w-80 text-white'>
        <h2 className='text-xl font-bold mb-4'>Deckel zahlen</h2>

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
              onClick={() => onConfirm(s.value)}
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

        <button className='mt-4 text-gray-300 underline' onClick={onClose}>
          Abbrechen
        </button>
      </div>
    </div>
  );
};
