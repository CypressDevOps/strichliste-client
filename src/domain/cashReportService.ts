// src/domain/cashReportService.ts

import { safeJsonParse } from '../utils/safeJson';

export interface DailyRevenue {
  date: string; // ISO date string (YYYY-MM-DD)
  revenue: number; // Total revenue for that day
  timestamp: string; // ISO timestamp when evening was closed
}

const STORAGE_KEY = 'cash_reports';

/**
 * Speichert den Umsatz für den aktuellen Tag
 */
export function saveDailyRevenue(revenue: number): void {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const reports = getAllReports();

  // Prüfe ob heute schon ein Eintrag existiert, wenn ja, überschreibe ihn
  const existingIndex = reports.findIndex((r) => r.date === dateStr);

  const newReport: DailyRevenue = {
    date: dateStr,
    revenue: revenue,
    timestamp: now.toISOString(),
  };

  if (existingIndex >= 0) {
    reports[existingIndex] = newReport;
  } else {
    reports.push(newReport);
  }

  // Sortiere nach Datum (neueste zuerst)
  reports.sort((a, b) => b.date.localeCompare(a.date));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

/**
 * Holt alle gespeicherten Berichte
 */
export function getAllReports(): DailyRevenue[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return safeJsonParse<DailyRevenue[]>(stored, [], {
      label: 'cash_reports',
      storageKey: STORAGE_KEY,
    });
  } catch (error) {
    console.error('Error loading cash reports:', error);
    return [];
  }
}

/**
 * Filtert Berichte nach Jahr und Monat
 * @param year - 4-stelliges Jahr (z.B. 2026)
 * @param month - Monat 1-12
 */
export function getReportsByMonth(year: number, month: number): DailyRevenue[] {
  const reports = getAllReports();
  const yearStr = year.toString();
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `${yearStr}-${monthStr}`;

  return reports.filter((r) => r.date.startsWith(prefix));
}

/**
 * Gibt das aktuelle Jahr und Monat zurück
 */
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // JavaScript Monate sind 0-basiert
  };
}

/**
 * Gibt eine Liste verfügbarer Jahre zurück (für Filter-Dropdown)
 */
export function getAvailableYears(): number[] {
  const reports = getAllReports();
  const years = new Set<number>();

  reports.forEach((r) => {
    const year = parseInt(r.date.split('-')[0], 10);
    years.add(year);
  });

  return Array.from(years).sort((a, b) => b - a); // Neueste zuerst
}
