// src/services/salesQueue.ts
/**
 * IndexedDB Queue für offline Sales-Tracking
 *
 * Funktionsweise:
 * 1. Verkäufe werden lokal in IndexedDB Queue gespeichert
 * 2. Hintergrund-Task synchronisiert Queue mit Firestore wenn online
 * 3. Nach erfolgreicher Sync werden Einträge aus Queue entfernt
 *
 * DATENSCHUTZ: Keine personenbezogenen Daten werden gespeichert!
 * Nur: Produktname, Menge, Preis, Timestamp, POS-ID
 */

const DB_NAME = 'sales_queue_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_sales';

export interface SaleEntry {
  sale_id: string;
  product_name: string;
  quantity: number;
  price_gross?: number;
  timestamp: string; // ISO 8601
  source_pos_id?: string;
  synced: boolean;
  retry_count: number;
  created_at: number; // timestamp für lokale Sortierung
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initialisiert IndexedDB
 */
async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store für pending sales
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'sale_id' });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('retry_count', 'retry_count', { unique: false });
      }
    };
  });
}

/**
 * Fügt einen neuen Verkauf zur Queue hinzu
 * Diese Funktion wird beim Verkauf aufgerufen
 */
export async function addSaleToQueue(
  productName: string,
  quantity: number,
  priceGross?: number
): Promise<string> {
  const db = await openDB();

  const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const entry: SaleEntry = {
    sale_id: saleId,
    product_name: productName,
    quantity,
    price_gross: priceGross,
    timestamp: new Date().toISOString(),
    source_pos_id: getPOSId(),
    synced: false,
    retry_count: 0,
    created_at: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(entry);

    request.onsuccess = () => resolve(saleId);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Holt alle ungesyncten Verkäufe aus der Queue
 */
export async function getPendingSales(): Promise<SaleEntry[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false)); // nur ungesynct

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Markiert einen Verkauf als gesynct
 */
export async function markAsSynced(saleId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(saleId);

    request.onsuccess = () => {
      const entry = request.result as SaleEntry;
      if (entry) {
        entry.synced = true;
        store.put(entry);
      }
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Löscht gesyncte Einträge die älter als X Tage sind (Aufräumen)
 */
export async function cleanupSyncedSales(olderThanDays: number = 7): Promise<number> {
  const db = await openDB();
  const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.openCursor(IDBKeyRange.only(true)); // nur synced=true

    let deleted = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const entry = cursor.value as SaleEntry;
        if (entry.created_at < cutoffTime) {
          cursor.delete();
          deleted++;
        }
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Erhöht Retry Count für fehlgeschlagene Sync-Versuche
 */
export async function incrementRetryCount(saleId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(saleId);

    request.onsuccess = () => {
      const entry = request.result as SaleEntry;
      if (entry) {
        entry.retry_count++;
        store.put(entry);
      }
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Statistiken über Queue
 */
export async function getQueueStats(): Promise<{
  pending: number;
  synced: number;
  failed: number;
}> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const entries = request.result as SaleEntry[];
      const stats = {
        pending: entries.filter((e) => !e.synced && e.retry_count < 5).length,
        synced: entries.filter((e) => e.synced).length,
        failed: entries.filter((e) => !e.synced && e.retry_count >= 5).length,
      };
      resolve(stats);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Gibt eindeutige POS-ID zurück (wird beim ersten Aufruf generiert und gespeichert)
 */
function getPOSId(): string {
  const STORAGE_KEY = 'pos_id';
  let posId = localStorage.getItem(STORAGE_KEY);

  if (!posId) {
    posId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, posId);
  }

  return posId;
}

/**
 * Exportiert alle Queue-Daten als JSON (für Debugging/Backup)
 */
export async function exportQueueData(): Promise<SaleEntry[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}
