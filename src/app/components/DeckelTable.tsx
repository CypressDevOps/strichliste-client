// src/app/components/DeckelTable.tsx
import React from 'react';
import { DeckelUIState, Transaction } from '../../domain/models';
import { formatCurrency, formatDate } from '../../utils/format';

interface DeckelTableProps {
  selectedDeckel: DeckelUIState | null;
  selectedTxId: string | null;
  setSelectedTxId: React.Dispatch<React.SetStateAction<string | null>>;
  onAdjustQuantity?: (txId: string, delta: number) => void;
  onDeleteTransaction?: (txId: string) => void;
  isReadOnly?: boolean;
}

/**
 * Prüft, ob eine Transaktion ein Produkt ist und korrigiert werden darf
 * Produkte sind:
 * - Negative Transaktionen (Verkäufe)
 * - NICHT "Rückgeld"
 * - NICHT "Trinkgeld"
 * - NICHT übertragen von einem anderen Deckel
 */
const isProductTransaction = (tx: Transaction): boolean => {
  // Muss ein Verkauf sein (negative sum)
  if (tx.sum >= 0) return false;

  // Nicht Rückgeld
  if (tx.description === 'Rückgeld') return false;

  // Nicht Trinkgeld
  if (tx.isTip) return false;

  // Nicht übertragen von anderem Deckel
  if (tx.transferredFrom) return false;

  return true;
};

const getStrichSegments = (count: number): number[] => {
  const segments: number[] = [];
  let remaining = count;

  while (remaining > 5) {
    segments.push(5);
    remaining -= 5;
  }

  if (remaining > 0) {
    segments.push(remaining);
  }

  return segments;
};

export const DeckelTable: React.FC<DeckelTableProps> = ({
  selectedDeckel,
  selectedTxId,
  setSelectedTxId,
  onAdjustQuantity,
  onDeleteTransaction,
  isReadOnly = false,
}) => {
  if (!selectedDeckel) return null;

  const transactions: Transaction[] = selectedDeckel.transactions ?? [];

  const totalCount = transactions.reduce((acc: number, t: Transaction) => acc + (t.count ?? 0), 0);

  const totalSum = transactions.reduce((acc: number, t: Transaction) => acc + (t.sum ?? 0), 0);

  return (
    <div className='bg-white/5 rounded-lg p-4'>
      <table className='w-full table-fixed text-left'>
        <thead>
          <tr className='text-sm text-gray-300 border-b border-gray-700'>
            <th className='py-2 px-2 w-1/6'>Datum</th>
            <th className='py-2 px-2 w-2/3'>Bezeichnung</th>
            <th className='py-2 px-2 w-1/12 text-right'>Anzahl</th>
            <th className='py-2 px-2 w-1/6 text-right'>Summe</th>
          </tr>
        </thead>

        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={4} className='py-6 text-center text-gray-300'>
                Keine Einträge vorhanden.
              </td>
            </tr>
          ) : (
            <>
              {transactions.map((t: Transaction, index: number) => {
                const isSelected = selectedTxId === t.id;
                const isPayment =
                  t.sum > 0 && (t.description === 'Zahlung' || t.description === 'Einzahlung');

                // Berechne Zwischensumme bis zu diesem Punkt (nur negative Transaktionen)
                let subtotal = 0;
                if (isPayment) {
                  for (let i = 0; i < index; i++) {
                    if (transactions[i].sum < 0) {
                      subtotal += transactions[i].sum;
                    }
                  }
                }

                return (
                  <React.Fragment key={t.id || index}>
                    {/* Zwischensumme vor Zahlung */}
                    {isPayment && subtotal < 0 && (
                      <tr className='bg-gray-700/30 border-b border-gray-600'>
                        <td className='py-2 px-2 text-sm text-gray-400 italic' colSpan={3}>
                          Zwischensumme vor Zahlung
                        </td>
                        <td className='py-2 px-2 text-sm text-right font-semibold'>
                          <span className='text-whte-400'>{formatCurrency(subtotal)}</span>
                        </td>
                      </tr>
                    )}

                    {/* Eigentliche Transaktion */}
                    <tr
                      className={`border-b border-gray-800 cursor-pointer ${
                        isSelected ? 'bg-white/5' : ''
                      }`}
                      onClick={() =>
                        setSelectedTxId((cur) => (cur === t.id ? null : (t.id ?? null)))
                      }
                    >
                      <td className='py-2 px-2 text-sm text-gray-300'>{formatDate(t.date)}</td>

                      <td className='py-2 px-2 text-sm text-gray-300'>
                        <div className='flex items-center gap-2'>
                          <span>{t.description}</span>
                          {t.transferredFrom && (
                            <span className='text-xs text-gray-500 italic'>
                              (von {t.transferredFrom})
                            </span>
                          )}
                          {t.count > 0 && (
                            <span className='inline-flex items-center gap-1'>
                              {getStrichSegments(t.count).map((segment, segmentIndex) => (
                                <img
                                  key={`${t.id ?? index}-${segmentIndex}`}
                                  src={`/images/strichliste-icons/strich-${segment}.png`}
                                  alt={`${segment}x`}
                                  className='h-6 inline-block opacity-80'
                                />
                              ))}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className='py-2 px-2 text-sm text-gray-300 text-right'>
                        {isProductTransaction(t) ? (
                          <div className='flex items-center justify-end gap-1'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAdjustQuantity?.(t.id ?? '', -1);
                              }}
                              disabled={t.count <= 1}
                              className={`px-2 py-1 rounded text-white text-xs ${
                                t.count <= 1
                                  ? 'bg-gray-500 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                            >
                              −
                            </button>
                            <span className='w-6 text-center'>{t.count}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAdjustQuantity?.(t.id ?? '', 1);
                              }}
                              className='px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs'
                            >
                              +
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction?.(t.id ?? '');
                              }}
                              disabled={isReadOnly}
                              className={`px-2 py-1 rounded text-white text-xs ml-1 ${
                                isReadOnly
                                  ? 'bg-gray-600 cursor-not-allowed'
                                  : 'bg-red-800 hover:bg-red-700'
                              }`}
                              title={
                                isReadOnly ? 'Kann nicht bearbeitet werden' : 'Eintrag löschen'
                              }
                            >
                              🗑️
                            </button>
                          </div>
                        ) : (
                          <span>{t.count}</span>
                        )}
                      </td>

                      <td className='py-2 px-2 text-sm text-gray-300 text-right'>
                        {t.sum < 0 ? (
                          <span className='text-red-400 font-semibold'>
                            {formatCurrency(t.sum)}
                          </span>
                        ) : t.sum > 0 ? (
                          <span className='text-green-400 font-semibold'>
                            +{formatCurrency(t.sum)}
                          </span>
                        ) : (
                          <span>{formatCurrency(t.sum)}</span>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </tbody>

        <tfoot>
          <tr className='border-t border-gray-300'>
            <td className='py-3 px-2 font-semibold'>Gesamtergebnis</td>
            <td />
            <td className='py-3 px-2 text-right font-semibold'>{totalCount}</td>
            <td className='py-3 px-2 text-right font-semibold'>
              {totalSum < 0 ? (
                <span className='text-red-400'>{formatCurrency(totalSum)}</span>
              ) : totalSum > 0 ? (
                <span className='text-green-400'>+{formatCurrency(totalSum)}</span>
              ) : (
                <span>{formatCurrency(totalSum)}</span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
