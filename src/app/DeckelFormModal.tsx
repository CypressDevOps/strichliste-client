// Ersetze src/app/DeckelFormModal.tsx durch diese Version
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingNames: string[]; // aktive Namen (nicht-bezahlt)
  onSave: (name: string, useSameOwner?: boolean) => void;
}

export const DeckelFormModal: React.FC<Props> = ({ isOpen, onClose, existingNames, onSave }) => {
  const [name, setName] = useState('');
  const [useSameOwner, setUseSameOwner] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasMatch = useMemo(() => {
    const normalized = name.trim().toLowerCase();
    return (
      normalized.length > 0 && existingNames.some((n) => n.trim().toLowerCase() === normalized)
    );
  }, [name, existingNames]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, useSameOwner && hasMatch);
    setName('');
    setUseSameOwner(false);
  };

  const handleClose = () => {
    setName('');
    setUseSameOwner(false);
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, name, useSameOwner, hasMatch]); // keine setState-Aufrufe hier

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-40 flex items-center justify-center bg-black/50'
      role='dialog'
      aria-modal='true'
      aria-labelledby='deckelform-title'
    >
      {/* Wichtig: text-black stellt sicher, dass alle Texte im Modal dunkel sind,
          unabhängig von globalen text-white auf Eltern */}
      <div
        className='bg-white text-black rounded-lg w-11/12 max-w-md p-6 shadow-lg'
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id='deckelform-title' className='text-lg font-semibold mb-2 text-gray-900'>
          Gast hinzufügen
        </h3>

        <label className='sr-only' htmlFor='deckel-name-input'>
          Name
        </label>
        <input
          id='deckel-name-input'
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Name'
          className='w-full p-2 rounded mb-3 border text-black placeholder:text-gray-500'
        />

        {hasMatch && (
          <label className='flex items-center gap-2 text-sm mb-3 text-gray-800'>
            <input
              type='checkbox'
              checked={useSameOwner}
              onChange={(e) => setUseSameOwner(e.target.checked)}
              aria-label='Gleicher Gast wie vorhandener Eintrag'
              className='w-4 h-4'
            />
            <span>Gleicher Gast wie vorhandener Eintrag (verknüpfen)</span>
          </label>
        )}

        <div className='flex justify-end gap-2'>
          <button
            onClick={handleClose}
            className='px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300'
            aria-label='Abbrechen'
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className='px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700'
            aria-label='Hinzufügen'
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};
