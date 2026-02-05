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
            transactions.map((t: Transaction) => {
              const isSelected = selectedTxId === t.id;

              return (
                <tr
                  key={t.id}
                  className={`border-b border-gray-800 cursor-pointer ${
                    isSelected ? 'bg-white/5' : ''
                  }`}
                  onClick={() => setSelectedTxId((cur) => (cur === t.id ? null : (t.id ?? null)))}
                >
                  <td className='py-2 px-2 text-sm text-gray-300'>{formatDate(t.date)}</td>

                  <td className='py-2 px-2 text-sm text-gray-300'>{t.description}</td>

                  <td className='py-2 px-2 text-sm text-gray-300 text-right'>{t.count}</td>

                  <td className='py-2 px-2 text-sm text-gray-300 text-right'>
                    {t.sum < 0 ? (
                      <span className='text-red-400 font-semibold'>{formatCurrency(t.sum)}</span>
                    ) : t.sum > 0 ? (
                      <span className='text-green-400 font-semibold'>+{formatCurrency(t.sum)}</span>
                    ) : (
                      <span>{formatCurrency(t.sum)}</span>
                    )}
                  </td>
                </tr>
              );
            })
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
