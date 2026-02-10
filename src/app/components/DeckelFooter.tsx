// src/app/components/DeckelFooter.tsx
import React from 'react';
import { DeckelUIState } from '../../domain/models';
import { canCloseEveningNow } from '../../utils/closeEvening';

interface DeckelFooterProps {
  isAbendGeschlossen: boolean;
  isSelectedPresent: boolean;
  selectedDeckel: DeckelUIState | null;
  isReadOnly: boolean;
  hasTransactions: boolean;
  darfDeckelGezahltWerden: boolean;
  darfKorrigieren: boolean;
  hasMultipleDeckel: boolean;

  onAddGuest: () => void;
  onDeleteGuest: () => void;
  onOpenCashier: () => void;
  onOpenCorrection: () => void;
  onAbendAbschliessen: () => void;
}

export const DeckelFooter: React.FC<DeckelFooterProps> = ({
  isAbendGeschlossen,
  isSelectedPresent,
  selectedDeckel,
  isReadOnly,
  darfDeckelGezahltWerden,
  darfKorrigieren,
  hasMultipleDeckel,
  onAddGuest,
  onDeleteGuest,
  onOpenCashier,
  onOpenCorrection,
  onAbendAbschliessen,
}) => {
  const closeAllowed = canCloseEveningNow();

  const handleAbendClick = () => {
    if (isAbendGeschlossen) return;
    if (!closeAllowed) return;
    // direkte Delegation an Parent-Handler
    onAbendAbschliessen();
  };

  return (
    <footer className='flex-shrink-0 flex justify-between items-center gap-4 border-t border-gray-700 px-4 py-3 overflow-x-hidden'>
      {/* Linke Seite */}
      <div className='flex items-center gap-3'>
        <button
          onClick={onAddGuest}
          disabled={isAbendGeschlossen}
          className={`px-6 py-3 text-lg font-bold rounded shadow transition ${
            !isAbendGeschlossen
              ? 'bg-green-600 text-white hover:bg-green-800'
              : 'bg-green-900/30 text-white/60 cursor-not-allowed'
          }`}
        >
          Gast hinzufügen
        </button>

        <button
          onClick={onDeleteGuest}
          disabled={!isSelectedPresent || isAbendGeschlossen}
          className={`px-5 py-3 text-lg font-bold rounded shadow transition ${
            isSelectedPresent && !isAbendGeschlossen
              ? 'bg-red-800 text-white hover:bg-red-900'
              : 'bg-red-900/30 text-white/60 cursor-not-allowed'
          }`}
        >
          Gast entfernen
        </button>
      </div>

      {/* Rechte Seite */}
      <div className='flex items-center gap-2 flex-wrap justify-end max-w-full mr-10'>
        <button
          onClick={onOpenCashier}
          disabled={!hasMultipleDeckel || isAbendGeschlossen}
          className={`px-4 py-2 text-base font-bold rounded shadow transition ${
            !hasMultipleDeckel || isAbendGeschlossen
              ? 'bg-blue-900/30 text-white/60 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-800'
          }`}
        >
          Kassieren
        </button>

        <button
          onClick={onOpenCorrection}
          disabled={!darfKorrigieren}
          className={`px-4 py-2 text-base font-bold rounded shadow transition ${
            darfKorrigieren
              ? 'bg-red-800 text-white hover:bg-red-900'
              : 'bg-red-900/30 text-white/60 cursor-not-allowed'
          }`}
        >
          Korrektur
        </button>

        <button
          onClick={handleAbendClick}
          disabled={isAbendGeschlossen || !closeAllowed}
          className={`px-5 py-2 font-bold text-base rounded shadow transition ${
            !isAbendGeschlossen && closeAllowed
              ? 'bg-yellow-300 text-blue-950 hover:bg-yellow-400'
              : 'bg-yellow-900/30 text-white/60 cursor-not-allowed'
          }`}
        >
          Abend abschließen
        </button>
      </div>
    </footer>
  );
};
