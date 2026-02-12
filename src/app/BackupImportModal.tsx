// src/app/BackupImportModal.tsx
import React, { useRef } from 'react';
import { importBackup } from '../utils/backupService';

interface BackupImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupImportModal: React.FC<BackupImportModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importBackup(file);
      // Nach erfolgreichem Import wird die Seite automatisch neu geladen
    } catch (error) {
      if (error instanceof Error && error.message !== 'Import abgebrochen') {
        alert(`Fehler beim Importieren: ${error.message}`);
      }
      onClose();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-11/12 max-w-md text-white'>
        <h2 className='text-2xl font-bold mb-4'>Backup importieren</h2>

        <div className='mb-6'>
          <p className='mb-3'>
            Wähle eine Backup-Datei aus, um deine gespeicherten Daten wiederherzustellen.
          </p>

          <div className='bg-red-900/30 border border-red-600 rounded p-3 mb-4'>
            <p className='text-sm text-red-200'>
              <strong>⚠️ Warnung:</strong> Der Import überschreibt alle aktuellen Daten! Stelle
              sicher, dass du zuerst ein aktuelles Backup erstellt hast.
            </p>
          </div>

          <div className='bg-gray-700 p-4 rounded'>
            <p className='text-sm text-gray-300 mb-2'>
              <strong>Hinweis:</strong> Backup-Dateien haben das Format{' '}
              <code className='bg-gray-600 px-2 py-1 rounded text-xs'>
                deckel-backup_YYYY-MM-DD_HH-MM-SS.json
              </code>
            </p>
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='.json'
            onChange={handleFileSelect}
            className='hidden'
          />
        </div>

        <div className='flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition'
          >
            Abbrechen
          </button>
          <button
            onClick={handleImportClick}
            className='flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded transition font-semibold'
          >
            Datei auswählen
          </button>
        </div>
      </div>
    </div>
  );
};
