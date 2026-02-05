// src/domain/deckelService.ts
import { useState } from 'react';
import { DECKEL_STATUS, DeckelUIState, Transaction } from './models';

/**
 * Robuste ID-Erzeugung: nutze crypto.randomUUID wenn verfügbar,
 * sonst ein kleines Fallback.
 */
// robustes generateId ohne `any` oder @ts-ignore
const generateId = (): string => {
  try {
    // Laufzeitprüfung: existiert globalThis.crypto.randomUUID und ist es eine Funktion?
    const maybeCrypto = globalThis.crypto as unknown;
    const hasRandomUUID =
      typeof maybeCrypto === 'object' &&
      maybeCrypto !== null &&
      typeof (maybeCrypto as { randomUUID?: unknown }).randomUUID === 'function';

    if (hasRandomUUID) {
      // sicherer Aufruf mit typed cast (kein `any`)
      return (maybeCrypto as { randomUUID: () => string }).randomUUID();
    }
  } catch {
    // ignore
  }

  // Fallback: kurze pseudo-random ID
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
};

//Hook
export const useDeckelState = () => {
  const [deckelList, setDeckelList] = useState<DeckelUIState[]>([]);
  const [isAbendGeschlossen, setIsAbendGeschlossen] = useState(false);
  const selectedDeckel = deckelList.find((d) => d.isSelected);

  const deckelSaldo = selectedDeckel
    ? (selectedDeckel.transactions ?? []).reduce((sum, t) => sum + t.sum, 0)
    : 0;

  const darfDeckelGezahltWerden = deckelSaldo < 0;
  // Hat der ausgewählte Deckel bezahlt?
  const gastHatBezahlt = selectedDeckel?.status === DECKEL_STATUS.BEZAHLT;

  // Neuen Deckel anlegen
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

  // Deckel auswählen / aktivieren
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

  // Deckel löschen
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

  // Transaktion hinzufügen
  const addTransaction = (deckelId: string, tx: Transaction) => {
    if (isAbendGeschlossen) return;

    const deckel = deckelList.find((d) => d.id === deckelId);
    if (!deckel) return;

    // WICHTIG: Wenn Deckel bezahlt → keine neuen Produkte
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

  // Transaktion entfernen
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

  // Flexible Entferner-Funktion
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

  // Sortierte Deckel-Liste
  const getSortedDeckel = (): DeckelUIState[] => {
    const statusOrder: Record<string, number> = {
      OFFEN: 1,
      BEZAHLT: 2,
      HISTORISCH: 3,
    };

    return [...deckelList].sort((a, b) => {
      const aVal = a.isActive ? 0 : (statusOrder[String(a.status)] ?? 99);
      const bVal = b.isActive ? 0 : (statusOrder[String(b.status)] ?? 99);

      const aTime =
        a.lastActivity instanceof Date
          ? a.lastActivity.getTime()
          : new Date(a.lastActivity).getTime();
      const bTime =
        b.lastActivity instanceof Date
          ? b.lastActivity.getTime()
          : new Date(b.lastActivity).getTime();

      return aVal - bVal || bTime - aTime;
    });
  };

  // Abend abschließen
  const abendAbschliessen = () => {
    setDeckelList((prev) =>
      prev.map((deckel) => {
        if (deckel.status === DECKEL_STATUS.BEZAHLT) return deckel;

        const transactions = deckel.transactions ?? [];
        const saldo = transactions.reduce((sum, t) => sum + t.sum, 0);

        if (saldo === 0) {
          return {
            ...deckel,
            status: DECKEL_STATUS.BEZAHLT,
            isActive: false,
            isSelected: deckel.isSelected,
          };
        }

        return {
          ...deckel,
          status: DECKEL_STATUS.OFFEN,
          isActive: deckel.isSelected && deckel.status === DECKEL_STATUS.OFFEN,
        };
      })
    );

    setIsAbendGeschlossen(true);
  };

  // Deckel als bezahlt oder offen markieren
  const markDeckelAsPaid = (deckelId: string, paid: boolean = true) => {
    if (isAbendGeschlossen) return;

    setDeckelList((prev) =>
      prev.map((d) =>
        d.id === deckelId
          ? {
              ...d,
              status: paid ? DECKEL_STATUS.BEZAHLT : DECKEL_STATUS.OFFEN,
              isActive: !paid, // bezahlt = inaktiv, offen = aktiv
              isSelected: d.isSelected,
              lastActivity: new Date(),
            }
          : d
      )
    );
  };

  return {
    deckelList,
    selectedDeckel,
    gastHatBezahlt,
    addDeckel,
    selectDeckel,
    deleteDeckel,
    addTransaction,
    removeTransaction,
    removeTransactionFlexible,
    setDeckelList,
    getSortedDeckel,
    abendAbschliessen,
    isAbendGeschlossen,
    setIsAbendGeschlossen,
    markDeckelAsPaid,
    darfDeckelGezahltWerden,
    generateId,
  };
};
