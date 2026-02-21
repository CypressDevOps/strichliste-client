// src/app/StockOverviewModal.tsx
/**
 * Stock Overview Modal
 * Zeigt Bestandstabelle mit Inline-Edit, Bulk-Operationen und Filtern
 */

import React, { useState, useMemo, useEffect } from 'react';
import { updateStock, bulkUpdateStock, filterStocks } from '../domain/stockService';
import { PackingBreakdownEntry, ProductStock, StockFilter } from '../domain/stockModels';
import { Product } from '../domain/models';
import { productService } from '../domain/productService';

interface StockOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockOverviewModal: React.FC<StockOverviewModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<StockFilter>({
    sort_by: 'name',
    sort_order: 'asc',
  });
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editBreakdown, setEditBreakdown] = useState<PackingBreakdownEntry[]>([]);
  const [isAutoTotal, setIsAutoTotal] = useState(true);
  const [bulkValue, setBulkValue] = useState<string>('');
  const [bulkOperation, setBulkOperation] = useState<'set' | 'add' | 'subtract'>('add');
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper: Pluralisiert Verpackungseinheiten
  const pluralizePackingUnit = (unit: string, count: number): string => {
    if (count === 1) return unit;

    switch (unit) {
      case 'Kiste':
        return 'Kisten';
      case 'Karton':
        return 'Kartons';
      case 'Palette':
        return 'Paletten';
      default:
        return unit;
    }
  };

  // Helper: Berechnet Verpackungsinfo-Anzeige
  const formatQuantityWithPacking = (
    stock: ProductStock
  ): { display: string; tooltip?: string } => {
    if (stock.packing_breakdown && stock.packing_breakdown.length > 0) {
      const sorted = [...stock.packing_breakdown].sort(
        (a, b) => b.units_per_pack - a.units_per_pack
      );
      const packedTotal = sorted.reduce(
        (sum, entry) => sum + entry.packs * entry.units_per_pack,
        0
      );
      const remainder = Math.max(0, stock.quantity - packedTotal);

      const displayParts = sorted.map((entry) => {
        const label = pluralizePackingUnit(entry.unit, entry.packs);
        return `${entry.packs} ${label}`;
      });
      if (remainder > 0) displayParts.push(`${remainder} St\u00fcck`);

      const tooltipParts = sorted.map((entry) => {
        const label = pluralizePackingUnit(entry.unit, entry.packs);
        return `${entry.packs} ${label} \u00e0 ${entry.units_per_pack} St\u00fcck`;
      });
      if (remainder > 0) tooltipParts.push(`Rest ${remainder} St\u00fcck`);

      return {
        display: `${displayParts.join(' + ')} (${stock.quantity} St\u00fcck)`,
        tooltip: tooltipParts.join(', '),
      };
    }
    if (stock.packing_unit && stock.units_per_pack && stock.packing_unit !== 'Einzelst\u00fcck') {
      const packs = Math.floor(stock.quantity / stock.units_per_pack);
      const remainder = stock.quantity % stock.units_per_pack;
      const unitLabel = pluralizePackingUnit(stock.packing_unit, packs);

      if (remainder === 0) {
        return {
          display: `${packs} ${unitLabel} (${stock.quantity} St\u00fcck)`,
          tooltip: `${packs} ${unitLabel} \u00e0 ${stock.units_per_pack} St\u00fcck`,
        };
      } else {
        return {
          display: `${packs} ${unitLabel} + ${remainder} (${stock.quantity} St\u00fcck)`,
          tooltip: `${packs} ${unitLabel} \u00e0 ${stock.units_per_pack} + ${remainder} St\u00fcck`,
        };
      }
    }
    return { display: `${stock.quantity}` };
  };

  const allProducts = useMemo(() => {
    return productService.loadProducts();
  }, []);

  const stocks = useMemo(() => {
    // Erst alle Stocks laden
    const allStocks = filterStocks(filter);
    const stockMap = new Map(allStocks.map((s) => [s.product_id, s]));

    // Dann alle Produkte iterieren und Stocks hinzufügen oder als 0 eintragen
    return allProducts.map(
      (product) =>
        stockMap.get(product.id) ||
        ({
          product_id: product.id,
          quantity: 0,
          unit: 'Stück' as const,
          threshold_low: 10,
          last_updated_at: new Date().toISOString(),
        } as ProductStock)
    );
    // refreshKey als Dependency um Re-Fetch bei externen Updates zu triggern
  }, [filter, allProducts, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const products = useMemo(() => {
    return new Map(allProducts.map((p: Product) => [p.id, p]));
  }, [allProducts]);

  // Refresh wenn Stock-Daten von außen geändert werden (z.B. von Import)
  useEffect(() => {
    const handleStockUpdated = () => {
      // Inkrementiere refreshKey um useMemo neu auszuführen
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener('stock-updated', handleStockUpdated);
    return () => window.removeEventListener('stock-updated', handleStockUpdated);
  }, []);

  const getPackedTotal = (breakdown: PackingBreakdownEntry[]): number => {
    return breakdown.reduce((sum, entry) => sum + entry.packs * entry.units_per_pack, 0);
  };

  useEffect(() => {
    if (!editingProductId || !isAutoTotal) return;
    const packedTotal = getPackedTotal(editBreakdown);
    Promise.resolve().then(() => setEditValue(packedTotal.toString()));
  }, [editingProductId, isAutoTotal, editBreakdown]);

  const handleEditStart = (stock: ProductStock) => {
    setEditingProductId(stock.product_id);
    setEditValue(stock.quantity.toString());
    setIsAutoTotal(true);
    if (stock.packing_breakdown && stock.packing_breakdown.length > 0) {
      setEditBreakdown(stock.packing_breakdown.map((entry) => ({ ...entry })));
      return;
    }

    if (stock.packing_unit && stock.units_per_pack && stock.packing_unit !== 'Einzelstück') {
      const packs = Math.floor(stock.quantity / stock.units_per_pack);
      if (packs > 0) {
        setEditBreakdown([
          {
            unit: stock.packing_unit,
            units_per_pack: stock.units_per_pack,
            packs,
          },
        ]);
        return;
      }
    }

    setEditBreakdown([]);
  };

  const handleBreakdownAdd = () => {
    setEditBreakdown((prev) => [...prev, { unit: 'Kiste', units_per_pack: 1, packs: 1 }]);
  };

  const handleBreakdownUpdate = (index: number, updates: Partial<PackingBreakdownEntry>) => {
    setEditBreakdown((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry))
    );
  };

  const handleBreakdownRemove = (index: number) => {
    setEditBreakdown((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditSave = (productId: string) => {
    const sanitizedBreakdown = editBreakdown
      .map((entry) => ({
        unit: entry.unit,
        units_per_pack: Number(entry.units_per_pack) || 0,
        packs: Number(entry.packs) || 0,
      }))
      .filter((entry) => entry.units_per_pack > 0 && entry.packs > 0);

    const packedTotal = getPackedTotal(sanitizedBreakdown);
    let value = parseInt(editValue, 10);

    if (isNaN(value)) {
      if (sanitizedBreakdown.length > 0) {
        value = packedTotal;
      } else {
        setMessage({ type: 'error', text: 'Ungültige Menge eingegeben' });
        return;
      }
    }

    if (value < 0) {
      setMessage({ type: 'error', text: 'Ungültige Menge eingegeben' });
      return;
    }

    if (sanitizedBreakdown.length > 0 && value < packedTotal) {
      setMessage({
        type: 'error',
        text: `Gesamtstückzahl (${value}) ist kleiner als die Packungs-Summe (${packedTotal}).`,
      });
      return;
    }

    const success = updateStock(
      productId,
      'manual',
      value,
      undefined,
      'Bestand bearbeitet',
      undefined,
      undefined,
      undefined,
      sanitizedBreakdown
    );
    if (success) {
      setMessage({ type: 'success', text: 'Bestand aktualisiert' });
      setEditingProductId(null);
      setEditBreakdown([]);
      setIsAutoTotal(true);
      setRefreshKey((prev) => prev + 1);
      // Force re-render
      window.dispatchEvent(new Event('stock-updated'));
    } else {
      setMessage({ type: 'error', text: 'Fehler beim Aktualisieren des Bestands' });
    }
  };

  const handleBulkUpdate = () => {
    if (selectedProductIds.size === 0) {
      setMessage({ type: 'error', text: 'Bitte wählen Sie mindestens ein Produkt aus' });
      return;
    }

    const value = parseInt(bulkValue, 10);
    if (isNaN(value) || value < 0) {
      setMessage({ type: 'error', text: 'Ungültige Menge eingegeben' });
      return;
    }

    const success = bulkUpdateStock({
      product_ids: Array.from(selectedProductIds),
      operation: bulkOperation,
      value,
      reason: 'Massenbearbeitung',
    });

    if (success) {
      setMessage({
        type: 'success',
        text: `${selectedProductIds.size} Produkte aktualisiert`,
      });
      setSelectedProductIds(new Set());
      setShowBulkEditor(false);
      window.dispatchEvent(new Event('stock-updated'));
    } else {
      setMessage({ type: 'error', text: 'Fehler bei der Massenbearbeitung' });
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedProductIds.size === stocks.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(stocks.map((s) => s.product_id)));
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
          <h2 className='text-2xl font-bold text-white flex items-center gap-2'>
            📦 Bestandsübersicht
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-3xl leading-none'
            aria-label='Schließen'
          >
            &times;
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`px-6 py-3 ${
              message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Filter Bar */}
        <div className='bg-gray-750 px-6 py-4 border-b border-gray-700 space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
            <input
              type='text'
              placeholder='Suche nach Name oder SKU...'
              value={filter.search || ''}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className='px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none'
            />

            <label className='flex items-center gap-2 text-white cursor-pointer'>
              <input
                type='checkbox'
                checked={filter.low_stock_only || false}
                onChange={(e) => setFilter({ ...filter, low_stock_only: e.target.checked })}
                className='w-4 h-4'
              />
              Nur niedriger Bestand
            </label>

            <select
              value={filter.sort_by || 'name'}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  sort_by: e.target.value as 'name' | 'quantity' | 'last_updated' | undefined,
                })
              }
              className='px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none'
            >
              <option value='name'>Sortierung: Name</option>
              <option value='quantity'>Sortierung: Bestand</option>
              <option value='last_updated'>Sortierung: Letzte Änderung</option>
            </select>

            <button
              onClick={() =>
                setFilter({ ...filter, sort_order: filter.sort_order === 'asc' ? 'desc' : 'asc' })
              }
              className='px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition'
            >
              {filter.sort_order === 'asc' ? '↑ Aufsteigend' : '↓ Absteigend'}
            </button>
          </div>

          {selectedProductIds.size > 0 && (
            <div className='flex gap-2 items-center'>
              <span className='text-white'>{selectedProductIds.size} ausgewählt</span>
              <button
                onClick={() => setShowBulkEditor(!showBulkEditor)}
                className='px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition'
              >
                Massen-Edit
              </button>
            </div>
          )}
        </div>

        {/* Bulk Editor */}
        {showBulkEditor && selectedProductIds.size > 0 && (
          <div className='bg-blue-900/30 px-6 py-4 border-b border-blue-700 flex gap-3 items-end flex-wrap'>
            <div className='flex-1 min-w-[150px]'>
              <label className='block text-sm text-gray-300 mb-1'>Aktion</label>
              <select
                value={bulkOperation}
                onChange={(e) => setBulkOperation(e.target.value as 'set' | 'add' | 'subtract')}
                className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
              >
                <option value='set'>Setzen auf</option>
                <option value='add'>Addieren</option>
                <option value='subtract'>Subtrahieren</option>
              </select>
            </div>

            <div className='flex-1 min-w-[150px]'>
              <label className='block text-sm text-gray-300 mb-1'>Menge</label>
              <input
                type='number'
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                min='0'
                className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
              />
            </div>

            <button
              onClick={handleBulkUpdate}
              className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition'
            >
              ✓ Anwenden
            </button>

            <button
              onClick={() => setShowBulkEditor(false)}
              className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition'
            >
              ✕ Abbrechen
            </button>
          </div>
        )}

        {/* Table */}
        <div className='flex-1 overflow-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-750 sticky top-0 border-b border-gray-700'>
              <tr>
                <th className='px-4 py-3 text-left'>
                  <input
                    type='checkbox'
                    checked={selectedProductIds.size === stocks.length && stocks.length > 0}
                    onChange={toggleAllSelection}
                    className='w-4 h-4'
                    aria-label='Alle auswählen'
                  />
                </th>
                <th className='px-4 py-3 text-left text-white font-semibold'>Produktname</th>
                <th className='px-4 py-3 text-left text-white font-semibold'>Kategorie</th>
                <th className='px-4 py-3 text-right text-white font-semibold'>Bestand</th>
                <th className='px-4 py-3 text-left text-white font-semibold'>Einheit</th>
                <th className='px-4 py-3 text-left text-gray-400 text-xs'>Letzte Änderung</th>
                <th className='px-4 py-3 text-center text-white font-semibold'>Aktionen</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-700'>
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-8 text-center text-gray-400'>
                    Keine Produkte gefunden
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => {
                  const product = products.get(stock.product_id);
                  const isLowStock = (stock.threshold_low || 10) > stock.quantity;

                  return (
                    <tr
                      key={stock.product_id}
                      className={`hover:bg-gray-750 transition ${
                        isLowStock ? 'bg-red-900/20' : ''
                      }`}
                    >
                      <td className='px-4 py-3'>
                        <input
                          type='checkbox'
                          checked={selectedProductIds.has(stock.product_id)}
                          onChange={() => toggleProductSelection(stock.product_id)}
                          className='w-4 h-4'
                        />
                      </td>
                      <td className='px-4 py-3 text-white font-medium'>
                        {product?.name || 'Unbekannt'}
                      </td>
                      <td className='px-4 py-3 text-gray-300'>{product?.category || '-'}</td>
                      <td className='px-4 py-3 text-right'>
                        {editingProductId === stock.product_id ? (
                          <div className='space-y-2 text-left'>
                            <div className='flex items-center gap-2'>
                              <label className='text-xs text-gray-300'>Stück</label>
                              <input
                                type='number'
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value);
                                  setIsAutoTotal(false);
                                }}
                                min='0'
                                className='w-20 px-2 py-1 bg-blue-700 text-white rounded border border-blue-500 text-center'
                              />
                              <button
                                onClick={() => {
                                  setIsAutoTotal(true);
                                  const packedTotal = getPackedTotal(editBreakdown);
                                  setEditValue(packedTotal.toString());
                                }}
                                className={`px-2 py-1 rounded text-xs ${
                                  isAutoTotal
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                }`}
                                title='Gesamtstückzahl automatisch aus Packungen berechnen'
                                type='button'
                              >
                                Auto
                              </button>
                              <button
                                onClick={() => handleEditSave(stock.product_id)}
                                className='px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs'
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProductId(null);
                                  setEditBreakdown([]);
                                  setIsAutoTotal(true);
                                }}
                                className='px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs'
                              >
                                Abbrechen
                              </button>
                            </div>

                            {editBreakdown.length > 0 && (
                              <div className='text-xs text-gray-300'>
                                Packungs-Summe: {getPackedTotal(editBreakdown)} Stück
                                {(() => {
                                  const totalValue = parseInt(editValue, 10);
                                  const packedTotal = getPackedTotal(editBreakdown);
                                  if (Number.isNaN(totalValue)) return null;
                                  const rest = totalValue - packedTotal;
                                  if (rest <= 0) return null;
                                  return ` • Rest: ${rest} Stück`;
                                })()}
                              </div>
                            )}

                            <div className='space-y-2'>
                              {editBreakdown.map((entry, index) => (
                                <div
                                  key={`${entry.unit}-${entry.units_per_pack}-${index}`}
                                  className='grid grid-cols-12 gap-2 items-center'
                                >
                                  <select
                                    value={entry.unit}
                                    onChange={(e) =>
                                      handleBreakdownUpdate(index, {
                                        unit: e.target.value as 'Kiste' | 'Karton' | 'Palette',
                                      })
                                    }
                                    className='col-span-4 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs'
                                  >
                                    <option value='Kiste'>Kiste</option>
                                    <option value='Karton'>Karton</option>
                                    <option value='Palette'>Palette</option>
                                  </select>
                                  <input
                                    type='number'
                                    min='1'
                                    value={entry.packs}
                                    onChange={(e) =>
                                      handleBreakdownUpdate(index, {
                                        packs: parseInt(e.target.value, 10) || 0,
                                      })
                                    }
                                    className='col-span-3 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs text-center'
                                  />
                                  <input
                                    type='number'
                                    min='1'
                                    value={entry.units_per_pack}
                                    onChange={(e) =>
                                      handleBreakdownUpdate(index, {
                                        units_per_pack: parseInt(e.target.value, 10) || 0,
                                      })
                                    }
                                    className='col-span-4 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs text-center'
                                  />
                                  <button
                                    onClick={() => handleBreakdownRemove(index)}
                                    className='col-span-1 px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs'
                                    aria-label='Eintrag entfernen'
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={handleBreakdownAdd}
                                className='px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs'
                              >
                                + Einheit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleEditStart(stock)}
                            className={`cursor-pointer font-semibold px-2 py-1 rounded ${
                              isLowStock
                                ? 'bg-red-600 text-white'
                                : 'text-green-400 hover:bg-gray-700'
                            }`}
                            title={formatQuantityWithPacking(stock).tooltip}
                          >
                            {formatQuantityWithPacking(stock).display}
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-3 text-gray-300'>{stock.unit}</td>
                      <td className='px-4 py-3 text-xs text-gray-400'>
                        {new Date(stock.last_updated_at).toLocaleString('de-DE', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <button
                          onClick={() => handleEditStart(stock)}
                          className='px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition'
                          title='Bearbeiten'
                        >
                          ✎
                        </button>
                      </td>
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
