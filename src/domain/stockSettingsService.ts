// src/domain/stockSettingsService.ts

import { setItemWithBackup } from '../utils/backupService';

const STOCK_SETTINGS_KEY = 'stock_live_tracking_enabled';

export function isLiveStockTrackingEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STOCK_SETTINGS_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

export function setLiveStockTracking(enabled: boolean): void {
  try {
    setItemWithBackup(STOCK_SETTINGS_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to save stock tracking setting:', err);
  }
}
