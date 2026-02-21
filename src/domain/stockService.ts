// src/domain/stockService.ts
/**
 * Bestandsverwaltungs-Service
 * Verwaltet Lagerbestände mit Historia und Audit-Log
 */

import { Product } from './models';
import { safeJsonParse } from '../utils/safeJson';
import {
  ProductStock,
  PackingBreakdownEntry,
  StockHistoryEntry,
  StockImportSession,
  StockActionType,
  BulkStockOperation,
  StockFilter,
} from './stockModels';

const STOCK_STORAGE_KEY = 'product_stocks';
const STOCK_HISTORY_KEY = 'stock_history';
const IMPORT_SESSION_KEY = 'import_sessions';

/**
 * Initialisiert das Bestandssystem
 * Falls Produkte existieren, werden sie mit Standard-Bestand initialisiert
 */
export function initializeStockSystem(products: Product[]): void {
  const existingStocks = getAllStocks();
  const newProducts = products.filter((p) => !existingStocks.find((s) => s.product_id === p.id));

  if (newProducts.length > 0) {
    const newStocks: ProductStock[] = newProducts.map((p) => ({
      product_id: p.id,
      quantity: 0,
      unit: 'Stück',
      threshold_low: 10,
      last_updated_at: new Date().toISOString(),
    }));

    const allStocks = [...existingStocks, ...newStocks];
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStocks));
  }
}

/**
 * Holt den Bestand eines Produkts
 */
export function getStock(productId: string): ProductStock | null {
  const stocks = getAllStocks();
  return stocks.find((s) => s.product_id === productId) || null;
}

/**
 * Holt alle Bestände
 */
export function getAllStocks(): ProductStock[] {
  try {
    const raw = localStorage.getItem(STOCK_STORAGE_KEY);
    return safeJsonParse(raw, [], {
      label: 'product_stocks',
      storageKey: STOCK_STORAGE_KEY,
    });
  } catch (error) {
    console.error('Fehler beim Laden der Bestände:', error);
    return [];
  }
}

/**
 * Speichert Bestände
 */
function saveStocks(stocks: ProductStock[]): void {
  try {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stocks));
  } catch (error) {
    console.error('Fehler beim Speichern der Bestände:', error);
  }
}

/**
 * Aktualisiert Bestand eines Produkts
 * @param productId - Produkt-ID
 * @param action - 'set' | 'add' | 'subtract'
 * @param value - Mengenwert
 * @param userId - Benutzer der Änderung
 * @param reason - Optionale Begründung
 * @returns true bei Erfolg
 */
export function updateStock(
  productId: string,
  action: StockActionType,
  value: number,
  userId?: string,
  reason?: string,
  packingUnit?: 'Einzelstück' | 'Kiste' | 'Karton' | 'Palette',
  unitsPerPack?: number,
  packsCount?: number,
  packingBreakdown?: PackingBreakdownEntry[]
): boolean {
  // Validierung
  if (value < 0 || !Number.isInteger(value)) {
    console.error('Ungültige Menge:', value);
    return false;
  }

  const stocks = getAllStocks();
  let stock = stocks.find((s) => s.product_id === productId);

  // Wenn Produkt nicht existiert, erstelle es mit Bestand 0
  if (!stock) {
    stock = {
      product_id: productId,
      quantity: 0,
      unit: 'Stück',
      threshold_low: 10,
      last_updated_at: new Date().toISOString(),
    };
    stocks.push(stock);
  }

  const previousValue = stock.quantity;
  let newValue = previousValue;

  // Berechne neuen Wert
  switch (action) {
    case 'set':
    case 'manual':
    case 'correction':
      newValue = Math.max(0, value); // Stelle sicher, dass nicht negativ
      break;
    case 'add':
      newValue = previousValue + value;
      break;
    case 'subtract':
      newValue = Math.max(0, previousValue - value);
      break;
  }

  // Update
  stock.quantity = newValue;
  stock.last_updated_at = new Date().toISOString();
  stock.last_updated_by = userId;

  const updateBreakdownEntry = (
    breakdown: PackingBreakdownEntry[],
    unit: 'Kiste' | 'Karton' | 'Palette',
    unitsPerPackValue: number,
    packsDelta: number
  ): PackingBreakdownEntry[] => {
    const next = [...breakdown];
    const existing = next.find(
      (entry) => entry.unit === unit && entry.units_per_pack === unitsPerPackValue
    );
    if (existing) {
      existing.packs = Math.max(0, existing.packs + packsDelta);
    } else if (packsDelta > 0) {
      next.push({ unit, units_per_pack: unitsPerPackValue, packs: packsDelta });
    }

    return next.filter((entry) => entry.packs > 0);
  };

  const normalizeBreakdown = (breakdown: PackingBreakdownEntry[]): PackingBreakdownEntry[] => {
    let totalPieces = breakdown.reduce((sum, entry) => sum + entry.packs * entry.units_per_pack, 0);
    if (totalPieces <= stock.quantity) return breakdown;

    const sorted = [...breakdown].sort((a, b) => b.units_per_pack - a.units_per_pack);
    for (const entry of sorted) {
      if (totalPieces <= stock.quantity) break;
      const excess = totalPieces - stock.quantity;
      const packsToRemove = Math.min(entry.packs, Math.ceil(excess / entry.units_per_pack));
      entry.packs = Math.max(0, entry.packs - packsToRemove);
      totalPieces -= packsToRemove * entry.units_per_pack;
    }

    return sorted.filter((entry) => entry.packs > 0);
  };

  // Update Verpackungsinformationen falls vorhanden
  if (packingUnit) {
    stock.packing_unit = packingUnit;
  }
  if (unitsPerPack && unitsPerPack > 0) {
    stock.units_per_pack = unitsPerPack;
  }

  if (packingUnit && packingUnit !== 'Einzelstück' && unitsPerPack && unitsPerPack > 0) {
    const packs = packsCount ?? Math.floor(value / unitsPerPack);
    const current = stock.packing_breakdown ?? [];

    if (action === 'add') {
      stock.packing_breakdown = updateBreakdownEntry(current, packingUnit, unitsPerPack, packs);
    } else if (action === 'subtract') {
      stock.packing_breakdown = updateBreakdownEntry(current, packingUnit, unitsPerPack, -packs);
    } else {
      stock.packing_breakdown =
        packs > 0 ? [{ unit: packingUnit, units_per_pack: unitsPerPack, packs }] : [];
    }
  } else if (action === 'set' || action === 'manual' || action === 'correction') {
    stock.packing_breakdown = [];
  }

  if (packingBreakdown) {
    const sanitized = packingBreakdown
      .map((entry) => ({
        unit: entry.unit,
        units_per_pack: Number(entry.units_per_pack) || 0,
        packs: Number(entry.packs) || 0,
      }))
      .filter((entry) => entry.units_per_pack > 0 && entry.packs > 0);

    stock.packing_breakdown = normalizeBreakdown(sanitized);
    stock.packing_unit = undefined;
    stock.units_per_pack = undefined;
  }

  if (stock.packing_breakdown && stock.packing_breakdown.length > 0) {
    stock.packing_breakdown = normalizeBreakdown(stock.packing_breakdown);
  }

  saveStocks(stocks);

  // Protokolliere Änderung
  recordStockHistory({
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    product_id: productId,
    user_id: userId,
    action_type: action,
    previous_value: previousValue,
    new_value: newValue,
    change_amount: newValue - previousValue,
    reason,
    source: 'manual',
    created_at: new Date().toISOString(),
  });

  return true;
}

/**
 * Führt Massen-Operation durch
 */
export function bulkUpdateStock(operation: BulkStockOperation, userId?: string): boolean {
  let success = true;

  for (const productId of operation.product_ids) {
    const result = updateStock(
      productId,
      operation.operation,
      operation.value,
      userId,
      operation.reason
    );
    if (!result) success = false;
  }

  return success;
}

/**
 * Holt Bestandshistoria
 */
export function getStockHistory(
  productId?: string,
  startDate?: string,
  endDate?: string
): StockHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STOCK_HISTORY_KEY);
    let history: StockHistoryEntry[] = safeJsonParse(raw, [], {
      label: 'stock_history',
      storageKey: STOCK_HISTORY_KEY,
    });

    if (productId) {
      history = history.filter((h) => h.product_id === productId);
    }

    if (startDate) {
      history = history.filter((h) => h.created_at >= startDate);
    }

    if (endDate) {
      history = history.filter((h) => h.created_at <= endDate);
    }

    return history.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Fehler beim Laden der Bestandshistoria:', error);
    return [];
  }
}

/**
 * Protokolliert einen Bestandshistorie-Eintrag
 */
function recordStockHistory(entry: StockHistoryEntry): void {
  try {
    const history = getStockHistory();
    history.push(entry);
    localStorage.setItem(STOCK_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Fehler beim Speichern der Bestandshistorie:', error);
  }
}

/**
 * Filtert Bestände nach Kriterien
 */
export function filterStocks(filter: StockFilter, stocks?: ProductStock[]): ProductStock[] {
  let result = stocks || getAllStocks();

  if (filter.search) {
    // TODO: Mit Produktdatenbank verknüpfen um Namen zu filtern
    // result = result.filter(s => /* product name matches */);
  }

  if (filter.low_stock_only) {
    const threshold = filter.low_threshold || 10;
    result = result.filter((s) => s.quantity < threshold);
  }

  // Sortierung
  if (filter.sort_by) {
    result.sort((a, b) => {
      const aVal = a[filter.sort_by as keyof ProductStock];
      const bVal = b[filter.sort_by as keyof ProductStock];

      if (aVal === undefined || bVal === undefined) return 0;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return filter.sort_order === 'desc' ? -comparison : comparison;
    });
  }

  return result;
}

/**
 * Exportiert Bestandshistoria als CSV
 */
export function exportHistoryAsCSV(
  productId?: string,
  startDate?: string,
  endDate?: string
): string {
  const history = getStockHistory(productId, startDate, endDate);
  const headers = [
    'Datum',
    'Produkt-ID',
    'Benutzer',
    'Aktion',
    'Vorher',
    'Nachher',
    'Änderung',
    'Grund',
    'Quelle',
  ];

  const rows = history.map((h) => [
    new Date(h.created_at).toLocaleString('de-DE'),
    h.product_id,
    h.user_id || '-',
    h.action_type,
    h.previous_value,
    h.new_value,
    h.change_amount || '-',
    h.reason || '-',
    h.source,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');

  return csv;
}

/**
 * Holt oder erstellt eine Import-Session
 */
export function createImportSession(userId?: string): StockImportSession {
  const session: StockImportSession = {
    id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  try {
    const sessions = getAllImportSessions();
    sessions.push(session);
    localStorage.setItem(IMPORT_SESSION_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Fehler beim Erstellen der Import-Session:', error);
  }

  return session;
}

/**
 * Holt alle Import-Sessions
 */
export function getAllImportSessions(): StockImportSession[] {
  try {
    const raw = localStorage.getItem(IMPORT_SESSION_KEY);
    return safeJsonParse(raw, [], {
      label: 'import_sessions',
      storageKey: IMPORT_SESSION_KEY,
    });
  } catch (error) {
    console.error('Fehler beim Laden der Import-Sessions:', error);
    return [];
  }
}

/**
 * Aktualisiert Import-Session Status
 */
export function updateImportSession(sessionId: string, updates: Partial<StockImportSession>): void {
  try {
    const sessions = getAllImportSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      Object.assign(session, updates, { processed_at: new Date().toISOString() });
      localStorage.setItem(IMPORT_SESSION_KEY, JSON.stringify(sessions));
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Import-Session:', error);
  }
}
