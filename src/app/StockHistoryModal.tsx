// src/app/StockHistoryModal.tsx
/**
 * Stock History Modal
 * Zeigt Bestandsänderungen mit Audit-Log
 */

import React, { useState, useMemo } from 'react';
import { getStockHistory, exportHistoryAsCSV } from '../domain/stockService';
import { Product } from '../domain/models';
import { productService } from '../domain/productService';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const history = useMemo(() => {
    let entries = getStockHistory(productId, startDate || undefined, endDate || undefined);

    if (filterAction !== 'all') {
      entries = entries.filter((h) => h.action_type === filterAction);
    }

    return entries;
  }, [productId, startDate, endDate, filterAction]);

  const products = useMemo(() => {
    const allProducts = productService.loadProducts();
    return new Map(allProducts.map((p: Product) => [p.id, p]));
  }, []);

  const handleExport = () => {
    const csv = exportHistoryAsCSV(productId, startDate || undefined, endDate || undefined);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bestandshistorie_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  const actionLabels: Record<string, string> = {
    set: 'Setzen',
    add: 'Addieren',
    subtract: 'Subtrahieren',
    import: 'Import',
    manual: 'Manuell',
    correction: 'Korrektur',
  };

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
          <h2 className='text-2xl font-bold text-white flex items-center gap-2'>
            📋 Bestandshistorie
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-3xl leading-none'
          >
            &times;
          </button>
        </div>

        {/* Filter Bar */}
        <div className='bg-gray-750 px-6 py-4 border-b border-gray-700 space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
            <div>
              <label className='block text-sm text-gray-300 mb-1'>Von Datum</label>
              <input
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
              />
            </div>

            <div>
              <label className='block text-sm text-gray-300 mb-1'>Bis Datum</label>
              <input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
              />
            </div>

            <div>
              <label className='block text-sm text-gray-300 mb-1'>Aktion</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
              >
                <option value='all'>Alle Aktionen</option>
                <option value='set'>Setzen</option>
                <option value='add'>Addieren</option>
                <option value='subtract'>Subtrahieren</option>
                <option value='import'>Import</option>
                <option value='manual'>Manuell</option>
                <option value='correction'>Korrektur</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition self-end'
            >
              📥 CSV Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className='flex-1 overflow-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-750 sticky top-0 border-b border-gray-700'>
              <tr>
                <th className='px-4 py-3 text-left text-white font-semibold'>Datum</th>
                {!productId && (
                  <th className='px-4 py-3 text-left text-white font-semibold'>Produkt</th>
                )}
                <th className='px-4 py-3 text-left text-white font-semibold'>Aktion</th>
                <th className='px-4 py-3 text-right text-white font-semibold'>Vorher</th>
                <th className='px-4 py-3 text-right text-white font-semibold'>Nachher</th>
                <th className='px-4 py-3 text-right text-white font-semibold'>Änderung</th>
                <th className='px-4 py-3 text-left text-white font-semibold'>Grund</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-700'>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={!productId ? 7 : 6} className='px-4 py-8 text-center text-gray-400'>
                    Keine Einträge gefunden
                  </td>
                </tr>
              ) : (
                history.map((entry) => {
                  const product = products.get(entry.product_id);
                  const changeDelta = entry.new_value - entry.previous_value;
                  const changeSign = changeDelta >= 0 ? '+' : '';

                  return (
                    <tr key={entry.id} className='hover:bg-gray-750 transition'>
                      <td className='px-4 py-3 text-gray-300 text-xs whitespace-nowrap'>
                        {new Date(entry.created_at).toLocaleString('de-DE', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      {!productId && (
                        <td className='px-4 py-3 text-white'>{product?.name || 'Unbekannt'}</td>
                      )}
                      <td className='px-4 py-3'>
                        <span className='px-2 py-1 rounded text-xs font-semibold bg-blue-900 text-blue-200'>
                          {actionLabels[entry.action_type] || entry.action_type}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-right font-medium text-gray-300'>
                        {entry.previous_value}
                      </td>
                      <td className='px-4 py-3 text-right font-medium'>
                        <span className='text-green-400'>{entry.new_value}</span>
                      </td>
                      <td className='px-4 py-3 text-right font-medium'>
                        <span className={changeDelta >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {changeSign}
                          {changeDelta}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-gray-400 text-sm'>{entry.reason || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex gap-3 justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition'
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
