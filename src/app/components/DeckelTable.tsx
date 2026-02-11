// src/app/components/DeckelTable.tsx
import React from 'react';
import { DeckelUIState, Transaction } from '../../domain/models';
import { formatCurrency, formatDate } from '../../utils/format';

interface DeckelTableProps {
  selectedDeckel: DeckelUIState | null;
  selectedTxId: string | null;
  setSelectedTxId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const DeckelTable: React.FC<DeckelTableProps> = ({
  selectedDeckel,
  selectedTxId,
  setSelectedTxId,
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
                          {t.count > 0 && t.count <= 5 && (
                            <img
                              src={`/images/strichliste-icons/strich-${t.count}.png`}
                              alt={`${t.count}x`}
                              className='h-6 inline-block opacity-80'
                            />
                          )}
                        </div>
                      </td>

                      <td className='py-2 px-2 text-sm text-gray-300 text-right'>{t.count}</td>

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
          <tr className='border-t border-gray-700'>
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
