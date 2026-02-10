// src/app/MergeSelectModal.tsx
import React from 'react';
import { DeckelUIState } from '../domain/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidates: DeckelUIState[]; // mögliche Ziele (ohne den zu korrigierenden)
  onSelectTarget: (targetId: string | null) => void; // null = kein Merge
  title?: string;
  description?: string;
}

export const MergeSelectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  candidates,
  onSelectTarget,
  title = 'Ziel auswählen',
  description = 'Es existieren mehrere Deckel mit diesem Namen. Wähle einen Deckel zum Zusammenführen oder "Keinen" für separaten Gast.',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      role='dialog'
      aria-modal='true'
    >
      <div className='bg-white text-black rounded-lg w-11/12 max-w-lg p-6 shadow-lg'>
        <h3 className='text-lg font-semibold mb-2'>{title}</h3>
        <p className='text-sm text-gray-700 mb-4'>{description}</p>

        <div className='space-y-2 max-h-64 overflow-auto mb-4'>
          {candidates.length === 0 ? (
            <div className='text-sm text-gray-600'>Keine passenden Ziel‑Deckel gefunden.</div>
          ) : (
            candidates.map((c) => (
              <div key={c.id} className='flex items-center justify-between p-2 border rounded'>
                <div>
                  <div className='font-medium text-gray-900'>{c.name}</div>
                  <div className='text-xs text-gray-600'>
                    Status: <span className='font-semibold'>{c.status}</span> · Letzte Aktivität:{' '}
                    {new Date(c.lastActivity).toLocaleString()}
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  <button
                    onClick={() => onSelectTarget(c.id)}
                    className='px-3 py-1 bg-blue-600 text-white rounded text-sm'
                  >
                    Merge in diesen Deckel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className='flex justify-between gap-2'>
          <button
            onClick={() => {
              onSelectTarget(null);
            }}
            className='px-3 py-2 bg-yellow-500 text-white rounded'
          >
            Keinen — separater Gast
          </button>
          <button onClick={onClose} className='px-3 py-2 bg-gray-200 text-gray-800 rounded'>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
