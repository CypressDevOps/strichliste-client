// src/app/BelegSelectModal.tsx
import React, { useState } from 'react';
import { DeckelUIState, DECKEL_STATUS } from '../domain/models';
import { generateBelegPDF, generateBelegPDFAsDataURL } from '../utils/pdfExportService';

interface BelegSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckelList: DeckelUIState[];
}

export const BelegSelectModal: React.FC<BelegSelectModalProps> = ({
  isOpen,
  onClose,
  deckelList,
}) => {
  const [selectedDeckel, setSelectedDeckel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Filtere nur bezahlte Deckel
  const bezahlteDeckel = deckelList.filter((d) => d.status === DECKEL_STATUS.BEZAHLT);

  const selectDeckel = (id: string) => {
    setSelectedDeckel(id);
  };

  const handleGenerateBeleg = async () => {
    if (!selectedDeckel) {
      alert('Bitte wählen Sie einen Deckel aus');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedDeckelData = deckelList.filter((d) => d.id === selectedDeckel);
      await generateBelegPDF(selectedDeckelData);
      setSelectedDeckel(null);
      onClose();
    } catch (error) {
      console.error('Fehler beim Generieren des Belegs:', error);
      alert('Fehler beim Erstellen des Belegs');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSharePDF = async () => {
    if (!selectedDeckel) {
      alert('Bitte wählen Sie einen Deckel aus');
      return;
    }

    // Prüfe ob Share API verfügbar ist
    if (!('share' in navigator)) {
      alert(
        'Teilen wird auf diesem Gerät nicht unterstützt. Nutzen Sie stattdessen "PDF herunterladen".'
      );
      return;
    }

    setIsGenerating(true);
    try {
      const selectedDeckelData = deckelList.filter((d) => d.id === selectedDeckel);
      const dataUrl = await generateBelegPDFAsDataURL(selectedDeckelData);

      // Konvertiere Data URL zu Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Erstelle sicheren Dateinamen (ohne Sonderzeichen)
      const safeName = selectedDeckelData[0].name.replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = new Date().getTime();
      const filename = `Beleg_${safeName}_${timestamp}.pdf`;

      const file = new File([blob], filename, {
        type: 'application/pdf',
        lastModified: timestamp,
      });

      // Prüfe ob Files geteilt werden können
      if ('canShare' in navigator && !navigator.canShare({ files: [file] })) {
        alert('PDF-Dateien können auf diesem Gerät nicht geteilt werden.');
        setIsGenerating(false);
        return;
      }

      // Teile das PDF
      await navigator.share({
        files: [file],
        title: 'Beleg',
        text: `Beleg für ${selectedDeckelData[0].name}`,
      });

      // Erfolgreich geteilt - Modal schließen
      setSelectedDeckel(null);
      onClose();
    } catch (error) {
      // AbortError bedeutet: User hat das Teilen abgebrochen - kein Fehler
      if ((error as Error).name !== 'AbortError') {
        console.error('Fehler beim Teilen des PDFs:', error);
        alert('Fehler beim Teilen des PDFs');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 rounded-lg shadow-2xl w-[600px] max-h-[80vh] border border-gray-700 flex flex-col'>
        <div className='px-6 py-4 border-b border-gray-700 flex justify-between items-center'>
          <h2 className='text-xl font-bold text-white'>Beleg erstellen</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-2xl font-bold'
            disabled={isGenerating}
          >
            ×
          </button>
        </div>

        <div className='p-6 overflow-y-auto flex-1'>
          <p className='text-gray-300 mb-4'>
            Wählen Sie den bezahlten Deckel aus, für den ein Beleg erstellt werden soll:
          </p>

          {bezahlteDeckel.length === 0 ? (
            <div className='text-center py-8 text-gray-400'>
              <p>Keine bezahlten Deckel vorhanden</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {bezahlteDeckel.map((deckel) => {
                const sum = (deckel.transactions ?? []).reduce((s, t) => s + (t.sum ?? 0), 0);
                return (
                  <label
                    key={deckel.id}
                    className='flex items-center gap-3 p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition'
                  >
                    <input
                      type='radio'
                      name='deckel-selection'
                      checked={selectedDeckel === deckel.id}
                      onChange={() => selectDeckel(deckel.id)}
                      className='w-5 h-5 cursor-pointer'
                    />
                    <div className='flex-1'>
                      <div className='font-semibold text-white'>{deckel.name}</div>
                      <div className='text-sm text-gray-400'>
                        {deckel.transactions?.length || 0} Positionen • Summe:{' '}
                        {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(sum)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className='px-6 py-4 border-t border-gray-700 flex flex-col gap-3'>
          <div className='flex gap-3'>
            <button
              onClick={handleGenerateBeleg}
              className='flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              disabled={isGenerating || !selectedDeckel}
            >
              {isGenerating ? (
                <>
                  <div className='inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white'></div>
                  Erstelle...
                </>
              ) : (
                <>
                  <span>📥</span>
                  PDF herunterladen
                </>
              )}
            </button>
            <button
              onClick={handleSharePDF}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              disabled={isGenerating || !selectedDeckel}
            >
              {isGenerating ? (
                <>
                  <div className='inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white'></div>
                  Erstelle...
                </>
              ) : (
                <>
                  <span>📤</span>
                  PDF teilen
                </>
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className='w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition'
            disabled={isGenerating}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
