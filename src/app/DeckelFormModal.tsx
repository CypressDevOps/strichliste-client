// src/app/DeckelFormModal.tsx
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  existingNames: string[];
}

export const DeckelFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, existingNames }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Der Name darf nicht leer sein.');
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError('Dieser Name existiert bereits.');
      return;
    }
    onSave(trimmed);
    setName('');
    setError('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-96 shadow-lg'>
        <h2 className='text-xl text-blue-950 font-semibold mb-4'>Neuen Deckel anlegen</h2>

        <label className='block text-blue-950 mb-2'>
          Name des Deckels
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            ref={inputRef}
            onKeyDown={handleKeyDown}
            className='border text-blue-950 w-full p-2 mt-1 rounded'
            placeholder='Tischnummer oder Gastname'
            aria-label='Name des Deckels'
          />
        </label>

        {error && <p className='text-red-700 text-sm mb-2'>{error}</p>}

        <div className='flex justify-end gap-2 mt-4'>
          <button onClick={onClose} className='px-4 py-2 bg-gray-700 rounded hover:bg-gray-800'>
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className='px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800'
          >
            Anlegen
          </button>
        </div>
      </div>
    </div>
  );
};
