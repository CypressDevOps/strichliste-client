import React, { useState } from 'react';
import {
  GastBeleg,
  CashPayment,
  CardPayment,
  TransferPayment,
  PaymentDetails,
} from '../domain/models';
import { printReceipt, exportReceiptToPDF } from '../domain/pdfExportService';

interface ReceiptModalProps {
  isOpen: boolean;
  receipt: GastBeleg | null;
  onClose: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

/**
 * Formatiert Betrag nach deutschem Standard: 1.234,56 €
 */
function formatCurrencyDE(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Type Guards für PaymentDetails
 */
function isCashPayment(details: PaymentDetails): details is CashPayment {
  return details.method === 'CASH';
}

function isCardPayment(details: PaymentDetails): details is CardPayment {
  return details.method === 'CARD';
}

function isTransferPayment(details: PaymentDetails): details is TransferPayment {
  return details.method === 'TRANSFER';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  receipt,
  onClose,
  onPrint,
  onDownload,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !receipt) return null;

  const handlePrint = async () => {
    try {
      setIsProcessing(true);
      if (onPrint) {
        await onPrint();
      } else {
        await printReceipt(receipt);
      }
    } catch (err) {
      console.error('Druck fehlgeschlagen:', err);
      alert('Drucken fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsProcessing(true);
      if (onDownload) {
        await onDownload();
      } else {
        await exportReceiptToPDF(receipt);
      }
    } catch (err) {
      console.error('Download fehlgeschlagen:', err);
      alert('Download fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl'>
        {/* Header */}
        <div className='sticky top-0 bg-gray-100 px-6 py-4 border-b border-gray-300 flex justify-between items-center'>
          <h2 className='text-xl font-bold text-gray-800'>🧾 Gastbeleg</h2>
          <button
            onClick={onClose}
            className='text-gray-600 hover:text-gray-800 text-2xl font-bold'
          >
            ×
          </button>
        </div>

        {/* Receipt Content - A4 Druck-gerecht */}
        <div className='p-8 bg-white text-gray-800 print:p-0'>
          {/* Logo & Kopfbereich */}
          <div className='flex items-center gap-4 mb-6 pb-4 border-b-2 border-gray-300'>
            {receipt.business.logoPath && (
              <img
                src={receipt.business.logoPath}
                alt={receipt.business.businessName}
                className='h-16 object-contain'
              />
            )}
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>{receipt.business.businessName}</h1>
              <p className='text-sm text-gray-600 whitespace-pre-line'>
                {receipt.business.address}
              </p>
            </div>
          </div>

          {/* Geschäftsdaten */}
          <div className='grid grid-cols-2 gap-4 mb-6 text-sm'>
            <div>
              {receipt.business.taxNumber && (
                <p>
                  <span className='font-semibold'>Steuernummer:</span> {receipt.business.taxNumber}
                </p>
              )}
              {receipt.business.vatId && (
                <p>
                  <span className='font-semibold'>UmsatzSt-ID:</span> {receipt.business.vatId}
                </p>
              )}
            </div>
            <div className='text-right'>
              {receipt.business.phone && (
                <p>
                  <span className='font-semibold'>Tel:</span> {receipt.business.phone}
                </p>
              )}
              {receipt.business.email && (
                <p>
                  <span className='font-semibold'>Email:</span> {receipt.business.email}
                </p>
              )}
            </div>
          </div>

          {/* Beleginformationen */}
          <div className='grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded text-sm'>
            <div>
              <p className='font-semibold'>Belegnummer: {receipt.receiptNumber}</p>
              <p className='text-gray-600'>
                {new Date(receipt.receiptDate).toLocaleDateString('de-DE')} {receipt.receiptTime}
              </p>
            </div>
            <div className='text-right'>
              {receipt.guestName && (
                <p>
                  <span className='font-semibold'>Gast:</span> {receipt.guestName}
                </p>
              )}
              {receipt.tableNumber && (
                <p>
                  <span className='font-semibold'>Tisch:</span> {receipt.tableNumber}
                </p>
              )}
            </div>
          </div>

          {/* Artikel-Liste */}
          <div className='mb-6'>
            <table className='w-full border-collapse text-sm'>
              <thead>
                <tr className='border-b-2 border-gray-400'>
                  <th className='text-left py-2 px-1 font-bold'>Artikel</th>
                  <th className='text-center py-2 px-1 font-bold w-16'>Menge</th>
                  <th className='text-right py-2 px-1 font-bold w-24'>Einzelpreis</th>
                  <th className='text-right py-2 px-1 font-bold w-20'>Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {receipt.lineItems.map((item, idx) => (
                  <tr key={idx} className='border-b border-gray-200'>
                    <td className='py-2 px-1'>
                      <div className='font-semibold'>{item.description}</div>
                      <div className='text-xs text-gray-500'>
                        ({item.taxRate}% MwSt, Netto: {formatCurrencyDE(item.lineTotalNet)})
                      </div>
                    </td>
                    <td className='text-center py-2 px-1'>{item.quantity}×</td>
                    <td className='text-right py-2 px-1'>{formatCurrencyDE(item.unitPriceNet)}</td>
                    <td className='text-right py-2 px-1 font-semibold'>
                      {formatCurrencyDE(item.lineTotalGross)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Steuerzusammenfassung */}
          <div className='mb-6 p-4 bg-gray-50 rounded'>
            <h3 className='font-bold mb-2 text-sm'>Steuerzusammenfassung:</h3>
            {receipt.taxSummaries.map((tax, idx) => (
              <div key={idx} className='flex justify-between text-sm mb-1'>
                <span>
                  {tax.taxRate}% MwSt auf {formatCurrencyDE(tax.netTotal)}:
                </span>
                <span className='font-semibold'>{formatCurrencyDE(tax.taxAmount)}</span>
              </div>
            ))}
          </div>

          {/* Summenbereich */}
          <div className='space-y-2 mb-6 p-4 bg-green-50 border-2 border-green-400 rounded'>
            <div className='flex justify-between text-sm'>
              <span>Gesamtnetto:</span>
              <span className='font-semibold'>{formatCurrencyDE(receipt.totalNet)}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span>Gesamtsteuer:</span>
              <span className='font-semibold'>{formatCurrencyDE(receipt.totalTax)}</span>
            </div>
            <div className='flex justify-between text-lg border-t-2 border-green-400 pt-2'>
              <span className='font-bold'>GESAMTBETRAG:</span>
              <span className='font-bold text-green-700'>
                {formatCurrencyDE(receipt.totalGross)}
              </span>
            </div>
          </div>

          {/* Zahlungsinformation */}
          <div className='mb-6 p-4 bg-blue-50 rounded text-sm'>
            <p className='font-semibold mb-1'>Zahlung:</p>
            {isCashPayment(receipt.paymentDetails) && (
              <>
                <p>Zahlungsart: Bargeld</p>
                <p>Erhaltener Betrag: {formatCurrencyDE(receipt.paymentDetails.amountReceived)}</p>
                <p className='font-semibold'>
                  Rückgeld: {formatCurrencyDE(receipt.paymentDetails.changeGiven)}
                </p>
              </>
            )}
            {isCardPayment(receipt.paymentDetails) && (
              <>
                <p>Zahlungsart: Kartenzahlung</p>
                {receipt.paymentDetails.cardLast4 && (
                  <p>Karte endend auf: **** {receipt.paymentDetails.cardLast4}</p>
                )}
              </>
            )}
            {isTransferPayment(receipt.paymentDetails) && (
              <>
                <p>Zahlungsart: Überweisung</p>
                {receipt.paymentDetails.reference && (
                  <p>Referenz: {receipt.paymentDetails.reference}</p>
                )}
              </>
            )}
          </div>

          {/* Fußbereich */}
          <div className='text-center py-6 border-t-2 border-gray-300 text-sm'>
            <p className='font-semibold mb-2 text-lg'>Vielen Dank für Ihren Besuch!</p>
          </div>
        </div>

        {/* Action Footer */}
        <div className='sticky bottom-0 bg-gray-100 px-6 py-4 border-t border-gray-300 flex gap-2 justify-end print:hidden'>
          <button
            onClick={handlePrint}
            disabled={isProcessing}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition'
          >
            🖨️ {isProcessing ? 'Verarbeite...' : 'Drucken'}
          </button>
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition'
          >
            📥 {isProcessing ? 'Verarbeite...' : 'Download'}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 transition'
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
