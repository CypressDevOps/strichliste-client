// src/app/DeckelOverviewModal.tsx
import React from 'react';
import { DeckelUIState, DECKEL_STATUS } from '../domain/models';

interface DeckelOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckelList: DeckelUIState[];
}

export const DeckelOverviewModal: React.FC<DeckelOverviewModalProps> = ({
  isOpen,
  onClose,
  deckelList,
}) => {
  if (!isOpen) return null;

  // Filter: OFFEN oder GONE mit negativem Saldo
  const relevantDeckel = deckelList.filter((d) => {
    if (d.status !== DECKEL_STATUS.OFFEN && d.status !== DECKEL_STATUS.GONE) {
      return false;
    }

    const saldo = (d.transactions ?? []).reduce((acc, t) => acc + t.sum, 0);
    return saldo < 0;
  });

  // Sortiere nach Erstellungsdatum (älteste zuerst)
  const sortedDeckel = [...relevantDeckel].sort((a, b) => {
    const aDate = new Date(a.lastActivity).getTime();
    const bDate = new Date(b.lastActivity).getTime();
    return aDate - bDate;
  });

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto text-white'>
        <h2 className='text-2xl font-bold mb-6'>Deckelübersicht (Offene Schulden)</h2>

        {sortedDeckel.length === 0 ? (
          <div className='text-center text-gray-400 py-8'>
            Keine offenen Deckel mit Schulden vorhanden
          </div>
        ) : (
          <div className='space-y-3 mb-6'>
            {sortedDeckel.map((deckel) => {
              const saldo = (deckel.transactions ?? []).reduce((acc, t) => acc + t.sum, 0);
              const createdDate = new Date(deckel.lastActivity);

              return (
                <div
                  key={deckel.id}
                  className='bg-gray-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-650 transition'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-3'>
                      <div className='font-semibold text-lg'>{deckel.name}</div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          deckel.status === DECKEL_STATUS.OFFEN
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {deckel.status === DECKEL_STATUS.OFFEN ? 'OFFEN' : 'GONE'}
                      </span>
                    </div>
                    <div className='text-sm text-gray-400 mt-1'>
                      Erstellt:{' '}
                      {createdDate.toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-gray-400'>Offener Betrag</div>
                    <div className='text-2xl font-bold text-red-400'>
                      {Math.abs(saldo).toFixed(2)} €
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Zusammenfassung */}
        {sortedDeckel.length > 0 && (
          <div className='bg-red-800 p-5 rounded-lg border-2 border-red-600 mb-6'>
            <div className='flex justify-between items-center'>
              <div>
                <div className='text-sm text-red-200 uppercase tracking-wide'>
                  Gesamt Offene Schulden
                </div>
                <div className='text-sm text-red-200 mt-1'>{sortedDeckel.length} Deckel</div>
              </div>
              <div className='text-4xl font-bold'>
                {sortedDeckel
                  .reduce((total, d) => {
                    const saldo = (d.transactions ?? []).reduce((acc, t) => acc + t.sum, 0);
                    return total + Math.abs(saldo);
                  }, 0)
                  .toFixed(2)}{' '}
                €
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className='flex justify-end'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded transition'
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
