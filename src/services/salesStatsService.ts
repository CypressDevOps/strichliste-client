// src/services/salesStatsService.ts
/**
 * Lokaler Verkaufsstatistik-Service mit localStorage
 *
 * DATENSCHUTZ: Keine personenbezogenen Daten!
 * Gespeichert werden nur: Produktname, Menge, Preis, Timestamp
 */
import { safeJsonParse } from '../utils/safeJson';
import { setItemWithBackup } from '../utils/backupService';

const STORAGE_KEY = 'sales_stats';

export interface SaleRecord {
  id: string;
  product_name: string;
  quantity: number;
  price_gross: number;
  timestamp: string; // ISO 8601
  date: string; // YYYY-MM-DD für einfaches Filtern
}

export interface SaleAggregate {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
}

export interface PeriodStats {
  period: string; // YYYY-MM oder YYYY oder "all"
  products: SaleAggregate[];
  total_quantity: number;
  total_revenue: number;
}

/**
 * Speichert einen neuen Verkauf in localStorage
 * Wird aufgerufen wenn ein Produkt verkauft wird
 */
export function recordSale(productName: string, quantity: number, priceGross: number): string {
  const sales = getAllSales();
  const now = new Date();

  const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const record: SaleRecord = {
    id: saleId,
    product_name: productName,
    quantity,
    price_gross: priceGross,
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0], // YYYY-MM-DD
  };

  sales.push(record);
  saveSales(sales);

  return saleId;
}

/**
 * Holt alle Verkäufe aus localStorage
 */
export function getAllSales(): SaleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return safeJsonParse(raw, [], {
      label: 'sales_stats',
      storageKey: STORAGE_KEY,
    });
  } catch (error) {
    console.error('Fehler beim Laden der Verkaufsstatistiken:', error);
    return [];
  }
}

/**
 * Speichert Verkäufe in localStorage
 */
function saveSales(sales: SaleRecord[]): void {
  try {
    setItemWithBackup(STORAGE_KEY, JSON.stringify(sales));
  } catch (error) {
    console.error('Fehler beim Speichern der Verkaufsstatistiken:', error);
  }
}

/**
 * Filtert Verkäufe nach Zeitraum
 */
export function getSalesByPeriod(startDate?: string, endDate?: string): SaleRecord[] {
  const sales = getAllSales();

  if (!startDate && !endDate) return sales;

  return sales.filter((sale) => {
    if (startDate && sale.date < startDate) return false;
    if (endDate && sale.date > endDate) return false;
    return true;
  });
}

/**
 * Aggregiert Verkäufe nach Produkt
 */
export function aggregateByProduct(sales: SaleRecord[]): SaleAggregate[] {
  const map = new Map<string, SaleAggregate>();

  sales.forEach((sale) => {
    const existing = map.get(sale.product_name);
    if (existing) {
      existing.total_quantity += sale.quantity;
      existing.total_revenue += sale.price_gross * sale.quantity;
      existing.sale_count++;
    } else {
      map.set(sale.product_name, {
        product_name: sale.product_name,
        total_quantity: sale.quantity,
        total_revenue: sale.price_gross * sale.quantity,
        sale_count: 1,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.total_revenue - a.total_revenue);
}

/**
 * Holt Top N Produkte nach Umsatz
 */
export function getTopProducts(
  limit: number = 10,
  startDate?: string,
  endDate?: string
): SaleAggregate[] {
  const sales = getSalesByPeriod(startDate, endDate);
  const aggregates = aggregateByProduct(sales);
  return aggregates.slice(0, limit);
}

/**
 * Aggregiert nach Monat
 */
export function aggregateByMonth(): PeriodStats[] {
  const sales = getAllSales();
  const map = new Map<string, SaleRecord[]>();

  sales.forEach((sale) => {
    const month = sale.date.substring(0, 7); // YYYY-MM
    if (!map.has(month)) {
      map.set(month, []);
    }
    map.get(month)!.push(sale);
  });

  const result: PeriodStats[] = [];
  map.forEach((monthSales, month) => {
    const products = aggregateByProduct(monthSales);
    result.push({
      period: month,
      products,
      total_quantity: products.reduce((sum, p) => sum + p.total_quantity, 0),
      total_revenue: products.reduce((sum, p) => sum + p.total_revenue, 0),
    });
  });

  return result.sort((a, b) => b.period.localeCompare(a.period));
}

/**
 * Aggregiert nach Jahr
 */
export function aggregateByYear(): PeriodStats[] {
  const sales = getAllSales();
  const map = new Map<string, SaleRecord[]>();

  sales.forEach((sale) => {
    const year = sale.date.substring(0, 4); // YYYY
    if (!map.has(year)) {
      map.set(year, []);
    }
    map.get(year)!.push(sale);
  });

  const result: PeriodStats[] = [];
  map.forEach((yearSales, year) => {
    const products = aggregateByProduct(yearSales);
    result.push({
      period: year,
      products,
      total_quantity: products.reduce((sum, p) => sum + p.total_quantity, 0),
      total_revenue: products.reduce((sum, p) => sum + p.total_revenue, 0),
    });
  });

  return result.sort((a, b) => b.period.localeCompare(a.period));
}

/**
 * Gesamtstatistik über alle Zeit
 */
export function getOverallStats(): PeriodStats {
  const sales = getAllSales();
  const products = aggregateByProduct(sales);

  return {
    period: 'all',
    products,
    total_quantity: products.reduce((sum, p) => sum + p.total_quantity, 0),
    total_revenue: products.reduce((sum, p) => sum + p.total_revenue, 0),
  };
}

/**
 * Exportiert Daten als CSV
 */
export function exportAsCSV(sales: SaleRecord[]): string {
  const headers = ['Datum', 'Uhrzeit', 'Produkt', 'Menge', 'Einzelpreis', 'Gesamt'];
  const rows = sales.map((sale) => {
    const dt = new Date(sale.timestamp);
    return [
      dt.toLocaleDateString('de-DE'),
      dt.toLocaleTimeString('de-DE'),
      sale.product_name,
      sale.quantity,
      sale.price_gross.toFixed(2),
      (sale.quantity * sale.price_gross).toFixed(2),
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\n');
}

/**
 * Exportiert Aggregate als CSV
 */
export function exportAggregateAsCSV(aggregates: SaleAggregate[]): string {
  const headers = ['Produkt', 'Verkaufte Menge', 'Gesamtumsatz', 'Anzahl Verkäufe'];
  const rows = aggregates.map((agg) => {
    return [
      agg.product_name,
      agg.total_quantity,
      agg.total_revenue.toFixed(2),
      agg.sale_count,
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\n');
}

/**
 * Exportiert Daten als JSON
 */
export function exportAsJSON(sales: SaleRecord[]): string {
  return JSON.stringify(sales, null, 2);
}

/**
 * Download-Helper für Exports
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Löscht alte Verkaufsdaten (Datenschutz/DSGVO)
 */
export function deleteOldSales(olderThanDays: number): number {
  const sales = getAllSales();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const filtered = sales.filter((sale) => sale.date >= cutoffStr);
  const deleted = sales.length - filtered.length;

  if (deleted > 0) {
    saveSales(filtered);
  }

  return deleted;
}

/**
 * Löscht alle Verkaufsdaten
 */
export function clearAllSales(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Statistik-Zusammenfassung
 */
export function getStatsSummary(startDate?: string, endDate?: string) {
  const sales = getSalesByPeriod(startDate, endDate);
  const products = aggregateByProduct(sales);

  const total_revenue = products.reduce((sum, p) => sum + p.total_revenue, 0);
  const total_quantity = products.reduce((sum, p) => sum + p.total_quantity, 0);
  const topProducts = products.sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 5);

  return {
    total_sales: sales.length,
    total_items_sold: total_quantity,
    total_revenue: total_revenue,
    top_product: topProducts[0]?.product_name || 'N/A',
    date_range:
      sales.length > 0
        ? {
            from: sales[0].date,
            to: sales[sales.length - 1].date,
          }
        : null,
  };
}
