// src/domain/deckelService.ts
import { useState, useEffect } from 'react';
import { DECKEL_STATUS, DeckelUIState, Transaction, DeckelStatus } from './models';
import {
  displayNameFromStored,
  getRootName,
  nextDisplayName,
  toDeckelForm,
} from '../utils/nameUtils';
// -----------------------------
// ID GENERATOR
// -----------------------------
const generateId = (): string => {
  try {
    const maybeCrypto = globalThis.crypto as unknown;
    const hasRandomUUID =
      typeof maybeCrypto === 'object' &&
      maybeCrypto !== null &&
      typeof (maybeCrypto as { randomUUID?: unknown }).randomUUID === 'function';

    if (hasRandomUUID) {
      return (maybeCrypto as { randomUUID: () => string }).randomUUID();
    }
  } catch {
    // Fallback
  }

  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
};

// -----------------------------
// MIGRATE LOADED LIST (module-level helper)
// moved here so it can be used by the lazy useState initializer
// -----------------------------
const migrateLoadedList = (list: DeckelUIState[]): DeckelUIState[] => {
  return list.map((d) => {
    const cleanedName = displayNameFromStored ? displayNameFromStored(d.name) : d.name;
    return {
      ...d,
      name: cleanedName,
      rootKey: getRootName(cleanedName),
    };
  });
};

// -----------------------------
// STORAGE KEYS
// -----------------------------
const STORAGE_KEY = 'deckel_state_v1';
const SESSION_MARKER_KEY = 'app_session_active';

// -----------------------------
// HELFER: Prüfen ob Browser neu gestartet wurde
// Thread-safe mit Timestamp zur Vermeidung von Multi-Tab Race Conditions
// -----------------------------
const isNewBrowserSession = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const hasSession = sessionStorage.getItem(SESSION_MARKER_KEY);
    const now = Date.now();

    if (!hasSession) {
      // Keine Session gefunden = Browser wurde neu gestartet
      // Setze Marker mit Timestamp für Multi-Tab Koordination
      sessionStorage.setItem(SESSION_MARKER_KEY, now.toString());
      return true;
    }

    // Multi-Tab Protection: Wenn Marker sehr alt ist (>100ms), anderer Tab hat bereits initialisiert
    const sessionTime = parseInt(hasSession, 10);
    if (!isNaN(sessionTime) && now - sessionTime > 100) {
      return false; // Anderer Tab war schneller
    }

    return false;
  } catch (error) {
    console.error('Session check failed:', error);
    return false; // Bei Fehler: Safe Default
  }
};

// -----------------------------
// HELFER: 05:00-Regel (NÄCHSTER TAG 05:00)
// -----------------------------
const isAfterFiveAM = (now: Date, closedAt: Date): boolean => {
  const nextFiveAM = new Date(closedAt);
  nextFiveAM.setDate(nextFiveAM.getDate() + 1);
  nextFiveAM.setHours(5, 0, 0, 0);
  return now.getTime() > nextFiveAM.getTime();
};

// -----------------------------
// INITIAL LOAD (LAZY) mit Migration ownerId
// -----------------------------
const loadInitialState = (): {
  list: DeckelUIState[];
  closed: boolean;
  closedAt: Date | null;
} => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      return { list: [], closed: false, closedAt: null };
    }

    const parsed = JSON.parse(raw);

    let list: DeckelUIState[] = parsed.deckelList ?? [];
    let closed = parsed.isAbendGeschlossen ?? false;
    let closedAt = parsed.abendClosedAt ? new Date(parsed.abendClosedAt) : null;

    // Migration: ownerId setzen, falls fehlt; parse dates with validation
    list = list.map((d) => {
      // Validate and parse lastActivity
      let lastActivity = new Date();
      try {
        const parsed = new Date(d.lastActivity);
        lastActivity = isNaN(parsed.getTime()) ? new Date() : parsed;
      } catch {
        console.warn('Invalid lastActivity date for deckel:', d.id);
      }

      // Validate and parse transaction dates
      const transactions = (d.transactions ?? []).map((t: Transaction) => {
        let txDate = new Date();
        try {
          const parsed = new Date(t.date);
          txDate = isNaN(parsed.getTime()) ? new Date() : parsed;
        } catch {
          console.warn('Invalid transaction date:', t.id);
        }
        return { ...t, date: txDate };
      });

      return {
        ...d,
        ownerId: d.ownerId ?? d.id,
        lastActivity,
        transactions,
      };
    });

    if (closed && closedAt) {
      const now = new Date();
      if (isAfterFiveAM(now, closedAt)) {
        // Nach dem nächsten Tag 05:00: bezahlte Deckel entfernen, Abend wieder öffnen
        list = list.filter((d) => d.status !== DECKEL_STATUS.BEZAHLT);
        closed = false;
        closedAt = null;
      }
    }

    // Bei neuem Browser-Start (aber nicht bei Refresh): Bezahlte Deckel entfernen
    const isNewSession = isNewBrowserSession();
    if (isNewSession) {
      const lengthBefore = list.length;
      list = list.filter((d) => d.status !== DECKEL_STATUS.BEZAHLT);

      // Falls Deckel entfernt wurden, sofort speichern
      if (list.length !== lengthBefore && typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            deckelList: list,
            isAbendGeschlossen: closed,
            abendClosedAt: closedAt?.toISOString() ?? null,
          })
        );
      }
    }

    return { list, closed, closedAt };
  } catch (error) {
    console.error('Failed to load initial state from localStorage:', error);
    // Notify user about data loss
    if (typeof window !== 'undefined' && error instanceof Error) {
      console.error('localStorage might be corrupted. Error:', error.message);
    }
    return { list: [], closed: false, closedAt: null };
  }
};

// -----------------------------
// HOOK
// -----------------------------
export const useDeckelState = () => {
  const initial = loadInitialState();

  const [deckelList, setDeckelList] = useState<DeckelUIState[]>(() => {
    // Use the already-parsed initial state which includes owner/date migration and 5:00 logic
    return migrateLoadedList(initial.list ?? []);
  });
  const [isAbendGeschlossen, setIsAbendGeschlossen] = useState(initial.closed);
  const [abendClosedAt, setAbendClosedAt] = useState<Date | null>(initial.closedAt);

  const selectedDeckel = deckelList.find((d) => d.isSelected);

  // -----------------------------
  // STORAGE: SAVE ON EVERY CHANGE with Quota Error Handling
  // -----------------------------
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const data = {
        deckelList,
        isAbendGeschlossen,
        abendClosedAt: abendClosedAt ? abendClosedAt.toISOString() : null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Data might not be saved.');
        // Notify user - could trigger a toast/modal in production
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(
            'Speicher voll! Bitte schließen Sie den Abend ab oder löschen Sie alte Daten.'
          );
        }
      } else {
        console.error('Failed to save to localStorage:', error);
      }
    }
  }, [deckelList, isAbendGeschlossen, abendClosedAt]);

  // -----------------------------
  // BUSINESS LOGIC
  // -----------------------------
  const deckelSaldo = selectedDeckel
    ? (selectedDeckel.transactions ?? []).reduce((sum, t) => sum + t.sum, 0)
    : 0;

  const darfDeckelGezahltWerden = deckelSaldo < 0;
  const gastHatBezahlt = selectedDeckel?.status === DECKEL_STATUS.BEZAHLT;

  /**
   * addDeckel
   * - name: string
   * - ownerId?: string  -> wenn übergeben, wird dieser ownerId verwendet (Verknüpfung)
   *
   * Rückgabe: neue id oder '' bei Fehler
   */
  // Ersetze deine vorhandene addDeckel-Funktion durch diese// Pfad anpassen

  const addDeckel = (name: string, ownerId?: string): string => {
    if (isAbendGeschlossen) return '';
    const trimmed = name.trim();
    if (!trimmed) return '';

    // Validate name length (max 100 characters)
    if (trimmed.length > 100) {
      console.error('addDeckel: Name too long (max 100 chars)');
      return '';
    }

    const newOwnerId = ownerId ?? generateId();

    // Generate id ONCE before setState (crucial for reliable return value)
    const createdId = generateId();

    if (ownerId) {
      const existsSameOwnerActive = deckelList.some(
        (d) => (d.ownerId ?? d.id) === newOwnerId && d.status !== DECKEL_STATUS.BEZAHLT
      );
      if (existsSameOwnerActive) {
        return '';
      }
    }

    // Normalisiere Eingabe zuerst in die gewünschte Deckel‑Form (possessive basis ohne "Deckel")
    const baseForDisplay = toDeckelForm(trimmed);

    setDeckelList((prev) => {
      // Verify ID doesn't exist (race condition protection)
      if (prev.some((d) => d.id === createdId)) {
        console.error('Race condition detected: ID already exists', createdId);
        return prev; // Abort if ID collision
      }

      // nextDisplayName berücksichtigt ALLE Deckel (auch BEZAHLT/GONE) um Nummern-Wiederverwendung zu vermeiden
      const displayName = nextDisplayName(baseForDisplay, prev);

      // rootKey für spätere, schnelle Vergleiche (z. B. beim Matchen)
      const rootKey = getRootName(displayName);

      const newDeckel: DeckelUIState = {
        id: createdId,
        ownerId: newOwnerId,
        name: displayName,
        rootKey,
        status: DECKEL_STATUS.OFFEN,
        isActive: true,
        lastActivity: new Date(),
        isSelected: true,
        transactions: [],
      };

      // vorherige Einträge deaktivieren
      const updatedPrev = prev.map((d) => ({ ...d, isActive: false, isSelected: false }));
      return [newDeckel, ...updatedPrev];
    });

    return createdId;
  };

  const selectDeckel = (id: string) => {
    setDeckelList((prev) =>
      prev.map((d) => ({
        ...d,
        isSelected: d.id === id,
        isActive: d.id === id && d.status === DECKEL_STATUS.OFFEN,
        lastActivity: d.id === id ? new Date() : d.lastActivity,
      }))
    );
  };

  const deleteDeckel = (id: string): boolean => {
    if (isAbendGeschlossen) return false;

    let removed = false;
    setDeckelList((prev) => {
      const next = prev.filter((d) => d.id !== id);
      removed = next.length !== prev.length;
      return next;
    });
    return removed;
  };

  const addTransaction = (deckelId: string, tx: Transaction) => {
    if (isAbendGeschlossen) return;

    const deckel = deckelList.find((d) => d.id === deckelId);
    if (!deckel) return;
    if (deckel.status === DECKEL_STATUS.BEZAHLT) return;

    const txWithId: Transaction = { ...tx, id: tx.id ?? generateId() };

    setDeckelList((prev) =>
      prev.map((d) =>
        d.id === deckelId
          ? {
              ...d,
              transactions: [...(d.transactions ?? []), txWithId],
              lastActivity: new Date(),
            }
          : d
      )
    );
  };

  const removeTransaction = (deckelId: string, txId: string) => {
    if (isAbendGeschlossen) return;

    setDeckelList((prev) =>
      prev.map((d) => {
        if (d.id !== deckelId) return d;
        const nextTx = (d.transactions ?? []).filter((t) => t.id !== txId);
        return { ...d, transactions: nextTx, lastActivity: new Date() };
      })
    );
  };

  const removeTransactionFlexible = (deckelId: string, txIdOrIdx: string) => {
    if (isAbendGeschlossen) return;

    setDeckelList((prev) =>
      prev.map((d) => {
        if (d.id !== deckelId) return d;

        const txs = d.transactions ?? [];
        let nextTxs = txs;

        if (txIdOrIdx.startsWith('idx:')) {
          const idx = Number(txIdOrIdx.split(':')[1]);
          if (!Number.isNaN(idx) && idx >= 0 && idx < txs.length) {
            nextTxs = txs.filter((_, i) => i !== idx);
          }
        } else {
          nextTxs = txs.filter((t) => t.id !== txIdOrIdx);
        }

        return { ...d, transactions: nextTxs, lastActivity: new Date() };
      })
    );
  };

  /**
   * updateDeckelStatus
   * sorgt für konsistente Flags (isActive/isSelected/lastActivity)
   */
  const updateDeckelStatus = (id: string, status: DeckelStatus) => {
    if (isAbendGeschlossen) return;

    setDeckelList((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;

        if (status === DECKEL_STATUS.GONE) {
          return {
            ...d,
            status,
            isActive: false,
            isSelected: false,
            lastActivity: new Date(),
          };
        }

        if (status === DECKEL_STATUS.BEZAHLT) {
          return {
            ...d,
            status,
            isActive: false,
            isSelected: false,
            lastActivity: new Date(),
          };
        }

        // OFFEN oder andere Status
        return {
          ...d,
          status,
          isActive: status === DECKEL_STATUS.OFFEN,
          lastActivity: status === DECKEL_STATUS.OFFEN ? new Date() : d.lastActivity,
        };
      })
    );
  };

  const getSortedDeckel = (): DeckelUIState[] => {
    const statusOrder: Record<string, number> = {
      OFFEN: 1,
      WEG: 2,
      GONE: 3,
      BEZAHLT: 4,
      HISTORISCH: 5,
    };

    return [...deckelList].sort((a, b) => {
      const aVal = a.isActive ? 0 : (statusOrder[a.status] ?? 99);
      const bVal = b.isActive ? 0 : (statusOrder[b.status] ?? 99);

      const aTime = new Date(a.lastActivity).getTime();
      const bTime = new Date(b.lastActivity).getTime();

      return aVal - bVal || bTime - aTime;
    });
  };

  const abendAbschliessen = () => {
    const now = new Date();

    // Atomare State-Updates: alle Änderungen in einem setState
    setDeckelList((prev) =>
      prev.map((deckel) => {
        if (deckel.status === DECKEL_STATUS.BEZAHLT) return deckel;

        const saldo = (deckel.transactions ?? []).reduce((s, t) => s + t.sum, 0);

        // 1) Saldo 0 -> "Gast hat bezahlt"
        if (saldo === 0) {
          return {
            ...deckel,
            status: DECKEL_STATUS.BEZAHLT,
            isActive: false,
          };
        }

        // 2) Alle anderen offenen Deckel -> "Gast ist gegangen" (GONE)
        return {
          ...deckel,
          status: DECKEL_STATUS.GONE,
          isActive: false,
        };
      })
    );

    // Batch state updates together
    setIsAbendGeschlossen(true);
    setAbendClosedAt(now);
  };

  const markDeckelAsPaid = (deckelId: string, paid: boolean = true) => {
    if (isAbendGeschlossen) return;

    setDeckelList((prev) =>
      prev.map((d) =>
        d.id === deckelId
          ? {
              ...d,
              status: paid ? DECKEL_STATUS.BEZAHLT : DECKEL_STATUS.OFFEN,
              isActive: !paid,
              lastActivity: new Date(),
              isSelected: paid ? false : d.isSelected,
            }
          : d
      )
    );
  };

  /**
   * mergeDeckelInto
   * - transferiert alle Transaktionen (außer optional excludeTxId) von fromId nach toId
   * - setzt fromId auf GONE
   * - atomar mit Rollback bei Fehlern
   */
  const mergeDeckelInto = (fromId: string, toId: string, excludeTxId?: string) => {
    if (isAbendGeschlossen) return;
    if (fromId === toId) {
      console.error('mergeDeckelInto: Cannot merge into self');
      return;
    }

    setDeckelList((prev) => {
      const from = prev.find((p) => p.id === fromId);
      const to = prev.find((p) => p.id === toId);

      // Validate before any mutation
      if (!from || !to) {
        console.error('mergeDeckelInto: Source or target not found', { fromId, toId });
        return prev; // Rollback: return unchanged state
      }

      try {
        // verbleibende Transaktionen vom 'from' (ohne excludeTxId)
        const remainingTxs = (from.transactions ?? [])
          .filter((t) => t.id !== excludeTxId)
          .map((t) => ({
            id: t.id ?? generateId(),
            date: t.date ?? new Date(),
            description: t.description,
            count: t.count,
            sum: t.sum,
          }));

        // append, vermeide Duplikate nach id
        const existingIds = new Set((to.transactions ?? []).map((t) => t.id));
        const appended = remainingTxs.filter((t) => !existingIds.has(t.id));

        // Erzeuge neue Liste atomar
        const next = prev
          .map((d) => {
            if (d.id === toId) {
              return {
                ...d,
                transactions: [...(d.transactions ?? []), ...appended],
                lastActivity: new Date(),
                isActive: true,
              };
            }
            if (d.id === fromId) {
              // entferne die übertragenen txs (behalte nur excludeTxId falls vorhanden)
              const kept = (d.transactions ?? []).filter((t) => t.id === excludeTxId);
              return {
                ...d,
                transactions: kept,
                status: DECKEL_STATUS.GONE,
                isActive: false,
                isSelected: false,
                lastActivity: new Date(),
              };
            }
            return d;
          })
          // Wenn nach dem Transfer keine Transaktionen mehr im 'from' Deckel sind, entferne ihn komplett
          .filter((d) => {
            if (d.id !== fromId) return true;
            const txCount = (d.transactions ?? []).length;
            return txCount > 0;
          });

        return next;
      } catch (error) {
        console.error('mergeDeckelInto failed, rolling back:', error);
        return prev; // Rollback on any error
      }
    });
  };

  /**
   * mergeInputIntoDeckel
   * - Wenn ein Nutzer beim Anlegen einen existierenden Root auswählt, wird
   *   der Input in den existierenden Deckel gemerged (keine neue Nummerierung).
   * - Fügt optional eine Notiz‑Transaktion hinzu, aktualisiert lastActivity.
   */
  const mergeInputIntoDeckel = (
    targetId: string,
    possBase: string,
    ownerId?: string
  ): { success: boolean; targetId?: string } => {
    if (isAbendGeschlossen) return { success: false };

    let found = false;
    setDeckelList((prev) => {
      const next = prev.map((d) => {
        if (d.id !== targetId) return d;
        found = true;
        // Optional: add a small merge note transaction
        const noteTx = {
          id: generateId(),
          date: new Date(),
          description: `Merge: ${possBase}`,
          count: 1,
          sum: 0,
        } as Transaction;

        return {
          ...d,
          ownerId: ownerId ?? d.ownerId,
          transactions: [...(d.transactions ?? []), noteTx],
          lastActivity: new Date(),
          isActive: true,
        };
      });
      return next;
    });

    return found ? { success: true, targetId } : { success: false };
  };

  /**
   * mergeCorrectionIntoDeckel
   * - Transfer remaining amount from a paid source deckel into an existing target deckel.
   * - Removes source deckel completely from the list after transfer.
   * - Returns MergeResult with success flag and ids.
   */
  type MergeResult = { success: boolean; targetId?: string; removedId?: string; message?: string };

  const mergeCorrectionIntoDeckel = (
    targetId: string,
    sourceId: string,
    options?: { note?: string; userId?: string; excludeTxId?: string }
  ): MergeResult => {
    if (isAbendGeschlossen) return { success: false, message: 'Abend geschlossen' };

    let performed = false;
    let removedId: string | undefined = undefined;
    let failReason: string | undefined = undefined;

    setDeckelList((prev) => {
      const target = prev.find((p) => p.id === targetId);
      const source = prev.find((p) => p.id === sourceId);
      if (!target) {
        failReason = 'Target not found';
        return prev;
      }
      if (!source) {
        failReason = 'Source not found';
        return prev;
      }
      if (targetId === sourceId) {
        failReason = 'Source and target are identical';
        return prev;
      }
      if (target.status === DECKEL_STATUS.BEZAHLT) {
        failReason = 'Target is paid';
        return prev;
      } // block merging into a paid deckel

      // Filter out the transaction being corrected and transfer all remaining txs
      const txsToTransfer = (source.transactions ?? [])
        .filter((t) => t.id !== options?.excludeTxId)
        .map((t) => ({
          ...t,
          description: `Korrektur — Zusammenführung von ${source.name} — ${t.description}`,
        }));

      performed = true;
      removedId = sourceId;

      // Update target with all remaining source transactions and remove source entirely
      return prev
        .map((d) => {
          if (d.id === targetId) {
            return {
              ...d,
              transactions: [...(d.transactions ?? []), ...txsToTransfer],
              lastActivity: new Date(),
              isActive: true,
            };
          }
          return d;
        })
        .filter((d) => d.id !== sourceId); // Remove source deckel from list
    });

    if (performed) {
      console.log('mergeCorrectionIntoDeckel', { sourceId, targetId, userId: options?.userId });
      return { success: true, targetId, removedId };
    }

    console.warn('mergeCorrectionIntoDeckel failed', { sourceId, targetId, reason: failReason });
    return { success: false, message: failReason ?? 'Merge could not be performed' };
  };

  /**
   * transferDeckels
   * - Transfer transactions from source to target deckel.
   * - If onlyNegative=true: transfers only negative (debt) transactions, leaves source with positive balance on OFFEN status
   * - If onlyNegative=false: transfers all transactions, marks source as BEZAHLT with cleared transactions
   * - Returns success info and original state for undo.
   */
  type TransferResult = {
    success: boolean;
    message?: string;
    targetId?: string;
    sourceId?: string;
    undoSnapshot?: DeckelUIState[];
  };

  const transferDeckels = (
    sourceId: string,
    targetId: string,
    onlyNegative = false
  ): TransferResult => {
    if (isAbendGeschlossen) return { success: false, message: 'Abend geschlossen' };
    if (sourceId === targetId)
      return { success: false, message: 'Source and target are identical' };

    let undoSnapshot: DeckelUIState[] | undefined = undefined;
    let performed = false;

    setDeckelList((prev) => {
      const source = prev.find((p) => p.id === sourceId);
      const target = prev.find((p) => p.id === targetId);
      if (!source || !target) return prev;

      // Save state for undo
      undoSnapshot = [...prev];

      // Determine which transactions to transfer
      let txsToTransfer: typeof source.transactions = [];
      let remainingTxs: typeof source.transactions = [];

      if (onlyNegative) {
        // Separate negative (debt) and positive (credit) transactions
        const sourceTxs = source.transactions ?? [];
        txsToTransfer = sourceTxs.filter((t) => t.sum < 0);
        remainingTxs = sourceTxs.filter((t) => t.sum >= 0);
      } else {
        // Transfer all transactions
        txsToTransfer = source.transactions ?? [];
        remainingTxs = [];
      }

      // Add marker to transferred transactions
      const markedTxs = txsToTransfer.map((t) => ({
        ...t,
        description: `Übertragen von ${source.name} — ${t.description}`,
      }));

      performed = true;

      // Add transactions to target and update source
      return prev.map((d) => {
        if (d.id === targetId) {
          return {
            ...d,
            transactions: [...(d.transactions ?? []), ...markedTxs],
            lastActivity: new Date(),
            isActive: true,
          };
        }
        if (d.id === sourceId) {
          return {
            ...d,
            // If onlyNegative and has remaining positive txs: stay OFFEN; otherwise: become BEZAHLT
            status:
              onlyNegative && remainingTxs.length > 0 ? DECKEL_STATUS.OFFEN : DECKEL_STATUS.BEZAHLT,
            transactions: remainingTxs,
            isActive: remainingTxs.length > 0,
          };
        }
        return d;
      });
    });

    if (performed) {
      console.log('transferDeckels', { sourceId, targetId, onlyNegative });
      return { success: true, targetId, sourceId, undoSnapshot };
    }

    return { success: false, message: 'Transfer could not be performed' };
  };

  return {
    deckelList,
    selectedDeckel,
    addDeckel,
    selectDeckel,
    deleteDeckel,
    addTransaction,
    removeTransaction,
    removeTransactionFlexible,
    updateDeckelStatus,
    getSortedDeckel,
    abendAbschliessen,
    isAbendGeschlossen,
    markDeckelAsPaid,
    darfDeckelGezahltWerden,
    gastHatBezahlt,
    mergeDeckelInto,
    mergeInputIntoDeckel,
    mergeCorrectionIntoDeckel,
    transferDeckels,
  };
};
