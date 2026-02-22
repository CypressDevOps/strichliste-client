// src/domain/technicalSettingsService.ts

import { setItemWithBackup } from '../utils/backupService';

export interface TechnicalSettings {
  backupPath: {
    windows?: string;
    android?: string;
    ios?: string;
    linux?: string;
    macos?: string;
    web?: string;
  };
  lastBackupDate?: string;
  lastBackupSize?: number;
  autoBackupEnabled: boolean;
  debugMode: boolean;
  appVersion: string;
  buildDate?: string;
}

export interface DebugInfo {
  settings: TechnicalSettings;
  platform: keyof TechnicalSettings['backupPath'];
  userAgent: string;
  storage: {
    localStorage: number;
    estimatedSize: number;
  };
  timestamp: string;
}

const STORAGE_KEY = 'technical_settings';

const DEFAULT_SETTINGS: TechnicalSettings = {
  backupPath: {
    windows: 'C:\\Users\\[Username]\\Downloads\\deckel-backup_*.json',
    android: '/Download/deckel-backup_*.json',
    ios: 'iCloud Drive / Files App',
    linux: '~/Downloads/deckel-backup_*.json',
    macos: '~/Downloads/deckel-backup_*.json',
    web: 'Browser Download Verzeichnis',
  },
  autoBackupEnabled: true,
  debugMode: false,
  appVersion: '1.0.0',
};

/**
 * Holt die aktuellen technischen Einstellungen
 */
export function getTechnicalSettings(): TechnicalSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Fehler beim Laden der technischen Einstellungen:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Speichert technische Einstellungen
 */
export function saveTechnicalSettings(settings: Partial<TechnicalSettings>): void {
  try {
    const current = getTechnicalSettings();
    const updated = { ...current, ...settings };
    setItemWithBackup(STORAGE_KEY, JSON.stringify(updated));
    console.log('Technische Einstellungen gespeichert:', updated);
  } catch (error) {
    console.error('Fehler beim Speichern der technischen Einstellungen:', error);
    throw error;
  }
}

/**
 * Aktualisiert den Backup-Pfad für eine spezifische Plattform
 */
export function setBackupPath(platform: keyof TechnicalSettings['backupPath'], path: string): void {
  const settings = getTechnicalSettings();
  settings.backupPath[platform] = path;
  saveTechnicalSettings(settings);
}

/**
 * Gibt den Backup-Pfad für die aktuelle Plattform zurück
 */
export function getCurrentBackupPath(): string {
  const settings = getTechnicalSettings();
  const platform = detectPlatform();
  const path = settings.backupPath[platform];
  return path || 'Unbekannt';
}

/**
 * Erkennt die aktuelle Plattform
 */
function detectPlatform(): keyof TechnicalSettings['backupPath'] {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/windows|win32/.test(userAgent)) return 'windows';
  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/linux/.test(userAgent)) return 'linux';
  if (/macintosh|macintel|macppc|macos/.test(userAgent)) return 'macos';

  return 'web';
}

/**
 * Aktualisiert die Backup-Metadaten (Zeitstempel, Größe)
 */
export function updateBackupMetadata(backupSize?: number): void {
  const settings = getTechnicalSettings();
  settings.lastBackupDate = new Date().toISOString();
  if (backupSize !== undefined) {
    settings.lastBackupSize = backupSize;
  }
  saveTechnicalSettings(settings);
}

/**
 * Aktiviert oder deaktiviert den Debug-Modus
 */
export function setDebugMode(enabled: boolean): void {
  const settings = getTechnicalSettings();
  settings.debugMode = enabled;
  saveTechnicalSettings(settings);

  if (enabled) {
    console.info('🔧 DEBUG MODE AKTIVIERT');
  } else {
    console.info('🔧 Debug Mode deaktiviert');
  }
}

/**
 * Gibt Debug-Informationen zurück
 */
export function getDebugInfo(): DebugInfo {
  const settings = getTechnicalSettings();
  return {
    settings,
    platform: detectPlatform(),
    userAgent: navigator.userAgent,
    storage: {
      localStorage: Object.keys(localStorage).length,
      estimatedSize: JSON.stringify(localStorage).length,
    },
    timestamp: new Date().toISOString(),
  };
}
