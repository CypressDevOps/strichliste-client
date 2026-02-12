// src/app/BelegQRModal.tsx
import React, { useEffect, useState } from 'react';

interface BelegQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDataUrl: string;
}

export const BelegQRModal: React.FC<BelegQRModalProps> = ({ isOpen, onClose, pdfDataUrl }) => {
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !pdfDataUrl) return;

    const createBlobUrl = async () => {
      try {
        // Konvertiere Data URL zu Blob
        const response = await fetch(pdfDataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error('Fehler beim Erstellen der Blob URL:', err);
      }
    };

    createBlobUrl();

    // Cleanup
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, pdfDataUrl]);

  const handleDownload = () => {
    if (!blobUrl) return;

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Beleg_${new Date().getTime()}.pdf`;
    link.click();
  };

  const handleShare = async () => {
    if (!pdfDataUrl) return;

    try {
      // Konvertiere Data URL zu Blob
      const response = await fetch(pdfDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `Beleg_${new Date().getTime()}.pdf`, {
        type: 'application/pdf',
      });

      if (
        'share' in navigator &&
        'canShare' in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'Beleg',
          text: 'Ihr Beleg vom Deckel Kassensystem',
        });
      } else {
        alert('Teilen wird auf diesem Gerät nicht unterstützt');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Fehler beim Teilen:', err);
        alert('Fehler beim Teilen der Datei');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 rounded-lg shadow-2xl w-[500px] border border-gray-700'>
        <div className='px-6 py-4 border-b border-gray-700 flex justify-between items-center'>
          <h2 className='text-xl font-bold text-white'>Beleg für Gast</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-white text-2xl font-bold'>
            ×
          </button>
        </div>

        <div className='p-6'>
          <p className='text-gray-300 mb-4 text-center'>
            Beleg wurde erstellt. Wählen Sie eine Option:
          </p>

          <div className='space-y-4'>
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!blobUrl}
              className='w-full px-4 py-3 bg-green-600 text-white text-lg rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-3'
            >
              <span>📥</span>
              <span>PDF herunterladen</span>
            </button>

            {/* Share Button (wenn verfügbar) */}
            {'share' in navigator && (
              <button
                onClick={handleShare}
                disabled={!pdfDataUrl}
                className='w-full px-4 py-3 bg-blue-600 text-white text-lg rounded hover:bg-blue-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-3'
              >
                <span>📤</span>
                <span>PDF teilen (Email, Bluetooth, etc.)</span>
              </button>
            )}
          </div>

          <div className='mt-4 text-xs text-gray-500 text-center bg-gray-700 p-3 rounded'>
            💡 Empfehlung: Nutzen Sie "PDF teilen" um den Beleg per Email oder Messenger an den Gast
            zu senden.
          </div>
        </div>

        <div className='px-6 py-4 border-t border-gray-700'>
          <button
            onClick={onClose}
            className='w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition'
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
