// src/utils/backupService.ts

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    deckel_state_v1: string | null;
    cash_reports: string | null;
    products: string | null;
    _all_data?: string | null;
  };
}

/**
 * Erstellt ein Backup aller wichtigen localStorage-Daten (ALLE Keys)
 */
export function createBackup(): BackupData {
  const allData: Record<string, string | null> = {};

  // Erfasse ALLE localStorage Einträge
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Ignoriere das Auto-Backup selbst um Rekursion zu vermeiden
      if (key !== 'deckel_auto_backup') {
        allData[key] = localStorage.getItem(key);
      }
    }
  }

  const backup: BackupData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      deckel_state_v1: localStorage.getItem('deckel_state_v1'),
      cash_reports: localStorage.getItem('cash_reports'),
      products: localStorage.getItem('products'),
      // Speichere auch ALLE anderen Einträge
      _all_data: JSON.stringify(allData),
    },
  };

  return backup;
}

/**
 * Exportiert das Backup als JSON-Datei und lädt es herunter
 */
export function exportBackup(): void {
  try {
    const backup = createBackup();
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Erstelle Download-Link mit Timestamp im Dateinamen
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);
    const filename = `deckel-backup_${timestamp}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);

    console.log('Backup erfolgreich exportiert:', filename);
  } catch (error) {
    console.error('Fehler beim Exportieren des Backups:', error);
    throw error;
  }
}

/**
 * Importiert ein Backup und stellt die Daten wieder her
 */
export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backup: BackupData = JSON.parse(content);

        // Validierung
        if (!backup.version || !backup.timestamp || !backup.data) {
          throw new Error('Ungültiges Backup-Format');
        }

        // Sicherheitsabfrage
        const confirmed = window.confirm(
          `Backup vom ${new Date(backup.timestamp).toLocaleString('de-DE')} importieren?\n\n` +
            'WARNUNG: Dies überschreibt alle aktuellen Daten!'
        );

        if (!confirmed) {
          reject(new Error('Import abgebrochen'));
          return;
        }

        // Daten wiederherstellen
        if (backup.data.deckel_state_v1) {
          localStorage.setItem('deckel_state_v1', backup.data.deckel_state_v1);
        }
        if (backup.data.cash_reports) {
          localStorage.setItem('cash_reports', backup.data.cash_reports);
        }
        if (backup.data.products) {
          localStorage.setItem('products', backup.data.products);
        }

        // Stelle ALLE Daten wieder her falls vorhanden
        if (backup.data._all_data) {
          try {
            const allData = JSON.parse(backup.data._all_data);
            for (const [key, value] of Object.entries(allData)) {
              if (value !== null) {
                localStorage.setItem(key, value as string);
              }
            }
          } catch (e) {
            console.warn('Konnte nicht alle Backup-Daten wiederherstellen:', e);
          }
        }

        console.log('Backup erfolgreich importiert');

        // Nach Import neu laden
        alert('Backup erfolgreich importiert! Die Seite wird neu geladen.');
        window.location.reload();

        resolve();
      } catch (error) {
        console.error('Fehler beim Importieren des Backups:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };

    reader.readAsText(file);
  });
}

/**
 * Registriert einen Event-Listener, der automatisch bei jedem localStorage-Change das Backup aktualisiert
 */
export function registerAutoBackupOnStorageChange(): () => void {
  let backupTimeout: ReturnType<typeof setTimeout> | null = null;

  const updateBackup = () => {
    try {
      saveBackupToLocalStorage();
    } catch (error) {
      console.error('Auto-Update des Backups fehlgeschlagen:', error);
    }
  };

  // Storage Event - triggert wenn localStorage von einer anderen Tab/Fenster geändert wird
  const handleStorageChange = () => {
    // Debounce: mehrere Änderungen in schneller Folge werden zu einer zusammengefasst
    if (backupTimeout) clearTimeout(backupTimeout);
    backupTimeout = setTimeout(updateBackup, 500);
  };

  // Zusätzlich überwachen wir localStorage Änderungen, die IN diesem Tab passieren
  // Das geht über unsere benutzerdefinierten Events
  const handleLocalStorageUpdate = () => {
    updateBackup();
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('deckel-storage-update', handleLocalStorageUpdate);

  console.log('Auto-Backup bei localStorage-Änderungen aktiviert');

  // Cleanup-Funktion zurückgeben
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('deckel-storage-update', handleLocalStorageUpdate);
    if (backupTimeout) clearTimeout(backupTimeout);
  };
}

/**
 * Hilfsfunktion: Speichert zu localStorage und triggert Auto-Backup
 * Nutze diese Funktion statt direktem localStorage.setItem() für besseres Tracking
 */
export function setItemWithBackup(key: string, value: string): void {
  localStorage.setItem(key, value);
  // Trigger Custom-Event damit das Backup aktualisiert wird
  window.dispatchEvent(new Event('deckel-storage-update'));
}

/**
 * Speichert ein Backup im localStorage (für automatische Wiederherstellung)
 */
export function saveBackupToLocalStorage(): void {
  try {
    const backup = createBackup();
    localStorage.setItem('deckel_auto_backup', JSON.stringify(backup));
    console.log('Auto-Backup im localStorage gespeichert');
  } catch (error) {
    console.error('Fehler beim Speichern des Auto-Backups:', error);
    throw error;
  }
}

/**
 * Prüft ob ein Auto-Backup verfügbar ist
 */
export function hasBackupAvailable(): boolean {
  return localStorage.getItem('deckel_auto_backup') !== null;
}

/**
 * Prüft ob die Hauptdaten fehlen (leer oder null)
 */
export function isMainDataMissing(): boolean {
  const deckelState = localStorage.getItem('deckel_state_v1');

  // Wenn key nicht existiert oder leer ist
  if (!deckelState) return true;

  try {
    const parsed = JSON.parse(deckelState);
    // Wenn das Array leer ist oder keine Deckel vorhanden sind
    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

/**
 * Prüft ob ein Restore vom Auto-Backup durchgeführt werden sollte
 */
export function shouldRestoreFromBackup(): boolean {
  return isMainDataMissing() && hasBackupAvailable();
}

/**
 * Stellt die Daten aus dem Auto-Backup wieder her
 */
export function restoreFromLocalBackup(): boolean {
  try {
    const backupString = localStorage.getItem('deckel_auto_backup');
    if (!backupString) {
      console.warn('Kein Auto-Backup gefunden');
      return false;
    }

    const backup: BackupData = JSON.parse(backupString);

    // Validierung
    if (!backup.version || !backup.timestamp || !backup.data) {
      console.error('Ungültiges Backup-Format');
      return false;
    }

    // Daten wiederherstellen
    if (backup.data.deckel_state_v1) {
      localStorage.setItem('deckel_state_v1', backup.data.deckel_state_v1);
    }
    if (backup.data.cash_reports) {
      localStorage.setItem('cash_reports', backup.data.cash_reports);
    }
    if (backup.data.products) {
      localStorage.setItem('products', backup.data.products);
    }

    // Stelle ALLE Daten wieder her falls vorhanden
    if (backup.data._all_data) {
      try {
        const allData = JSON.parse(backup.data._all_data);
        for (const [key, value] of Object.entries(allData)) {
          if (value !== null) {
            localStorage.setItem(key, value as string);
          }
        }
      } catch (e) {
        console.warn('Konnte nicht alle Backup-Daten wiederherstellen:', e);
      }
    }

    console.log(
      'Auto-Backup erfolgreich wiederhergestellt vom',
      new Date(backup.timestamp).toLocaleString('de-DE')
    );
    return true;
  } catch (error) {
    console.error('Fehler beim Wiederherstellen des Auto-Backups:', error);
    return false;
  }
}
