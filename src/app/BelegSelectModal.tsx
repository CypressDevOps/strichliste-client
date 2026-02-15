// src/app/BelegSelectModal.tsx
import React, { useState } from 'react';
import { DeckelUIState, DECKEL_STATUS, Product } from '../domain/models';
import { generateReceipt } from '../domain/receiptGenerator';
import { exportReceiptToPDF } from '../domain/pdfExportService';
import { loadBusinessInfo } from '../domain/businessInfoService';

interface BelegSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckelList: DeckelUIState[];
  products: Product[];
}

export const BelegSelectModal: React.FC<BelegSelectModalProps> = ({
  isOpen,
  onClose,
  deckelList,
  products,
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
      const deckel = deckelList.find((d) => d.id === selectedDeckel);
      if (!deckel) {
        alert('Deckel nicht gefunden');
        return;
      }

      // Validiere Status
      if (deckel.status !== DECKEL_STATUS.BEZAHLT) {
        alert(`Beleg kann nur für bezahlte Deckel erstellt werden.\nStatus: ${deckel.status}`);
        return;
      }

      // Nur Verkäufe (negative Transaktionen, ohne Rückgeld und ohne Trinkgeld)
      const transactions = deckel.transactions || [];
      const salesTransactions = transactions.filter(
        (tx) => tx.sum < 0 && tx.description !== 'Rückgeld' && !tx.isTip
      );

      if (salesTransactions.length === 0) {
        alert('Gast hat keine Verkäufe - Beleg kann nicht erstellt werden');
        return;
      }

      // Erstelle Tax-Rate-Map: Snacks = 7%, Rest = 19%
      const taxRateMap = new Map<string, number>();
      for (const product of products) {
        const taxRate = product.category === 'Snacks' ? 7 : 19;
        taxRateMap.set(product.name, taxRate);
      }

      // Berechne Gesamtsumme (BRUTTO)
      const totalGrossToPay = Math.abs(salesTransactions.reduce((sum, tx) => sum + tx.sum, 0));

      // Finde Rückgeld- und Trinkgeld-Transaktionen
      const changeTransaction = transactions.find((tx) => tx.description === 'Rückgeld');
      const tipTransaction = transactions.find(
        (tx) => tx.isTip === true || tx.description === 'Trinkgeld'
      );

      let changeGiven: number = Math.abs(changeTransaction?.sum ?? 0); // Rückgeld ist negativ
      let tip: number | undefined = Math.abs(tipTransaction?.sum ?? 0); // Trinkgeld ist negativ

      // Wenn tip 0 ist, setze auf undefined
      if (tip === 0) tip = undefined;

      // Berechne amountReceived: totalGross + changeGiven + (tip || 0)
      const amountReceived = totalGrossToPay + changeGiven + (tip || 0);

      // Debug
      console.log('BelegSelectModal handleGenerateBeleg - Payment Details:', {
        totalGrossToPay: totalGrossToPay,
        changeGiven: changeGiven,
        tip: tip,
        amountReceived: amountReceived,
      });

      // Generiere Receipt mit neuer Logik
      const receipt = await generateReceipt({
        business: loadBusinessInfo(),
        transactions: salesTransactions,
        paymentMethod: 'CASH',
        paymentDetails: { amountReceived, changeGiven, tip },
        guestName: deckel.name,
        tableNumber: deckel.id,
        taxRateMap,
      });

      // Exportiere als PDF
      await exportReceiptToPDF(receipt);

      setSelectedDeckel(null);
      onClose();
    } catch (error) {
      console.error('Fehler beim Generieren des Belegs:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      alert(`Fehler beim Erstellen des Belegs:\n${errorMsg}`);
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
      const deckel = deckelList.find((d) => d.id === selectedDeckel);
      if (!deckel) {
        alert('Deckel nicht gefunden');
        return;
      }

      // Validiere Status
      if (deckel.status !== DECKEL_STATUS.BEZAHLT) {
        alert(`Beleg kann nur für bezahlte Deckel erstellt werden.\nStatus: ${deckel.status}`);
        return;
      }

      // Nur Verkäufe (negative Transaktionen, ohne Rückgeld)
      const transactions = deckel.transactions || [];
      const salesTransactions = transactions.filter(
        (tx) => tx.sum < 0 && tx.description !== 'Rückgeld'
      );

      if (salesTransactions.length === 0) {
        alert('Gast hat keine Verkäufe - Beleg kann nicht erstellt werden');
        return;
      }

      // Erstelle Tax-Rate-Map: Snacks = 7%, Rest = 19%
      const taxRateMap = new Map<string, number>();
      for (const product of products) {
        const taxRate = product.category === 'Snacks' ? 7 : 19;
        taxRateMap.set(product.name, taxRate);
      }

      // Berechne Gesamtsumme (BRUTTO)
      const totalGrossToPay = Math.abs(salesTransactions.reduce((sum, tx) => sum + tx.sum, 0));

      // Alle positiven Transaktionen (Einzahlung + Zahlung) summieren
      const allPaymentTransactions = transactions.filter((tx) => (tx.sum ?? 0) > 0);
      const totalPaidAmount = allPaymentTransactions.reduce((sum, tx) => sum + (tx.sum ?? 0), 0);

      // Finde Rückgeld- und Trinkgeld-Transaktionen für die Quittung
      const changeTransaction = transactions.find((tx) => tx.description === 'Rückgeld');
      const tipTransaction = transactions.find(
        (tx) => tx.isTip === true || tx.description === 'Trinkgeld'
      );

      let amountReceived: number;
      let changeGiven: number = Math.abs(changeTransaction?.sum ?? 0); // Rückgeld ist negativ
      let tip: number | undefined = Math.abs(tipTransaction?.sum ?? 0); // Trinkgeld ist negativ

      // Debug
      console.log('BelegSelectModal - Payment Details:', {
        'changeTransaction found': !!changeTransaction,
        'changeTransaction sum': changeTransaction?.sum,
        changeGiven: changeGiven,
        'tipTransaction found': !!tipTransaction,
        'tipTransaction sum': tipTransaction?.sum,
        'tipTransaction isTip': tipTransaction?.isTip,
        'tipTransaction description': tipTransaction?.description,
        'tip calculated': tip,
      });

      // Wenn tip 0 ist, setze auf undefined
      if (tip === 0) tip = undefined;

      // Wenn zahlungen mit Rückgeld-Info vorhanden sind, nutze den Gesamtbetrag
      const paymentWithDetails = allPaymentTransactions.find(
        (tx) => tx.amountReceived && tx.changeGiven !== undefined
      );

      if (paymentWithDetails?.amountReceived && paymentWithDetails?.changeGiven !== undefined) {
        // Bei nur einer Payment-TX mit Details: nutze diese
        // Bei mehreren: summiere alle positiven Transaktionen
        if (allPaymentTransactions.length === 1) {
          amountReceived = paymentWithDetails.amountReceived;
        } else {
          // Mehrere Zahlungen/Einzahlungen - nutze Gesamtsumme
          amountReceived = totalPaidAmount;
        }
      } else {
        // Fallback: Aufrunden auf nächste 0,50€
        amountReceived = Math.ceil(totalGrossToPay * 2) / 2;
      }

      // Generiere Receipt mit neuer Logik
      const receipt = await generateReceipt({
        business: loadBusinessInfo(),
        transactions: salesTransactions,
        paymentMethod: 'CASH',
        paymentDetails: { amountReceived, changeGiven, tip },
        guestName: deckel.name,
        tableNumber: deckel.id,
        taxRateMap,
      });

      // Exportiere als PDF und teile es - TODO: PDF sharing funktionalität muss noch implementiert werden
      // Vorerst: Exportiere einfach
      await exportReceiptToPDF(receipt);
      alert('PDF wurde heruntergeladen. Teilen-Funktion folgt in Kürze.');

      setSelectedDeckel(null);
      onClose();
    } catch (error) {
      // AbortError bedeutet: User hat das Teilen abgebrochen - kein Fehler
      if ((error as Error).name !== 'AbortError') {
        console.error('Fehler beim Teilen des PDFs:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
        alert(`Fehler beim Teilen des PDFs:\n${errorMsg}`);
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
