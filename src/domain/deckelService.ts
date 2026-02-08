// src/domain/deckelService.ts
import { useState, useEffect } from 'react';
import { DECKEL_STATUS, DeckelUIState, Transaction } from './models';

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
  } catch {}

  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
};

// -----------------------------
// STORAGE KEYS
// -----------------------------
const STORAGE_KEY = 'deckel_state_v1';

// -----------------------------
// HELFER: 05:00-Regel
// -----------------------------
const isAfterFiveAM = (now: Date, closedAt: Date): boolean => {
  const fiveAM = new Date(closedAt);
  fiveAM.setHours(5, 0, 0, 0);
  return now.getTime() > fiveAM.getTime();
};

// -----------------------------
// INITIAL LOAD (LAZY)
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

    // Dates rekonstruieren
    list = list.map((d) => ({
      ...d,
      lastActivity: new Date(d.lastActivity),
      transactions: (d.transactions ?? []).map((t: Transaction) => ({
        ...t,
        date: new Date(t.date),
      })),
    }));

    // 05:00-Reset-Logik
    if (closed && closedAt) {
      const now = new Date();
      if (isAfterFiveAM(now, closedAt)) {
        list = list.filter((d) => d.status !== DECKEL_STATUS.BEZAHLT);
        closed = false;
        closedAt = null;
      }
    }

    return { list, closed, closedAt };
  } catch {
    return { list: [], closed: false, closedAt: null };
  }
};

// -----------------------------
// HOOK
// -----------------------------
export const useDeckelState = () => {
  const initial = loadInitialState();

  const [deckelList, setDeckelList] = useState<DeckelUIState[]>(initial.list);
  const [isAbendGeschlossen, setIsAbendGeschlossen] = useState(initial.closed);
  const [abendClosedAt, setAbendClosedAt] = useState<Date | null>(initial.closedAt);

  const selectedDeckel = deckelList.find((d) => d.isSelected);

  // -----------------------------
  // STORAGE: SAVE ON EVERY CHANGE
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
    } catch (err) {
      console.error('Fehler beim Speichern in localStorage:', err);
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

  const addDeckel = (name: string): string => {
    if (isAbendGeschlossen) return '';

    const newDeckel: DeckelUIState = {
      id: generateId(),
      name,
      status: DECKEL_STATUS.OFFEN,
      isActive: true,
      lastActivity: new Date(),
      isSelected: true,
      transactions: [],
    };

    setDeckelList((prev) => [
      newDeckel,
      ...prev.map((d) => ({ ...d, isActive: false, isSelected: false })),
    ]);

    return newDeckel.id;
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

  const getSortedDeckel = (): DeckelUIState[] => {
    const statusOrder: Record<string, number> = {
      OFFEN: 1,
      BEZAHLT: 2,
      HISTORISCH: 3,
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
    setDeckelList((prev) =>
      prev.map((deckel) => {
        if (deckel.status === DECKEL_STATUS.BEZAHLT) return deckel;

        const saldo = (deckel.transactions ?? []).reduce((s, t) => s + t.sum, 0);

        if (saldo === 0) {
          return {
            ...deckel,
            status: DECKEL_STATUS.BEZAHLT,
            isActive: false,
          };
        }

        return {
          ...deckel,
          status: DECKEL_STATUS.OFFEN,
          isActive: deckel.isSelected,
        };
      })
    );

    setIsAbendGeschlossen(true);
    setAbendClosedAt(new Date());
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
            }
          : d
      )
    );
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
    getSortedDeckel,
    abendAbschliessen,
    isAbendGeschlossen,
    markDeckelAsPaid,
    darfDeckelGezahltWerden,
    gastHatBezahlt,
  };
};
