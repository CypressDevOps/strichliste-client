// src/domain/businessInfoService.ts
import { BusinessData } from './models';
import { safeJsonParse } from '../utils/safeJson';

const STORAGE_KEY = 'business_info';

const DEFAULT_BUSINESS_INFO: BusinessData = {
  businessName: 'Schützenverein Lindschied e.V.',
  address: 'Hauptstraße 19\n65307 Bad Schwalbach',
  taxNumber: '12 345 678 901',
  vatId: 'DE123456789',
  logoPath: '/images/logo.png',
  // backgroundPath wird nicht als Default gesetzt - wird stattdessen im UI mit Fallback geladen
};

/**
 * Lädt Betriebsinformationen aus localStorage oder liefert Defaults
 */
export function loadBusinessInfo(): BusinessData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BUSINESS_INFO;

    const parsed = safeJsonParse<Partial<BusinessData>>(
      raw,
      {},
      {
        label: 'business_info',
        storageKey: STORAGE_KEY,
      }
    );
    return {
      ...DEFAULT_BUSINESS_INFO,
      ...parsed,
    };
  } catch {
    return DEFAULT_BUSINESS_INFO;
  }
}

/**
 * Speichert Betriebsinformationen in localStorage
 */
export function saveBusinessInfo(info: BusinessData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch (error) {
    console.error('Fehler beim Speichern der Betriebsinfos:', error);
  }
}

/**
 * Setzt Betriebsinformationen auf Defaults zurück
 */
export function resetBusinessInfo(): BusinessData {
  saveBusinessInfo(DEFAULT_BUSINESS_INFO);
  return DEFAULT_BUSINESS_INFO;
}
