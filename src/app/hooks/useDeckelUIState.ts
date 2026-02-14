// src/app/hooks/useDeckelUIState.ts
import { useState } from 'react';
import { DeckelUIState, Transaction, DeckelStatus, DECKEL_STATUS } from '../../domain/models';
import { getRootName } from '../../utils/nameUtils';
import { saveBackupToLocalStorage } from '../../utils/backupService';

interface UIHookProps {
  deckelList: DeckelUIState[];
  selectDeckel: (id: string) => void;
  deleteDeckel: (id: string) => void;
  removeTransaction: (deckelId: string, txId: string) => void;
  abendAbschliessen: () => void;
  addTransaction: (deckelId: string, tx: Transaction) => void;
  markDeckelAsPaid: (id: string, paid?: boolean) => void;
  updateDeckelStatus: (id: string, status: DeckelStatus) => void;
  mergeDeckelInto?: (fromId: string, toId: string, excludeTxId?: string) => void;
}

type ConfirmType = 'delete' | 'correction' | 'abend' | null;

export const useDeckelUIState = ({
  deckelList,
  selectDeckel,
  deleteDeckel,
  removeTransaction,
  abendAbschliessen,
  addTransaction,
  markDeckelAsPaid,
  updateDeckelStatus,
  mergeDeckelInto,
}: UIHookProps) => {
  const [selectedDeckelId, setSelectedDeckelId] = useState<string | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const selectedDeckel = deckelList.find((d) => d.id === selectedDeckelId) ?? null;

  const [modals, setModals] = useState({
    addGuest: false,
    transaction: false,
    correction: false,
    confirm: false,
    pay: false,
    mergeSelect: false, // neu: Merge Auswahl Modal
    mergeCorrection: false,
  });

  const [confirmState, setConfirmState] = useState<{
    type: ConfirmType;
    message: string;
    label: string;
    payload?: string;
    confirmClassName?: string;
  }>({
    type: null,
    message: '',
    label: 'Bestätigen',
    confirmClassName: undefined,
  });

  // Merge flow state
  const [mergeCandidates, setMergeCandidates] = useState<DeckelUIState[]>([]);
  const [pendingCorrectionTxId, setPendingCorrectionTxId] = useState<string | null>(null);
  const [pendingCorrectionDeckelId, setPendingCorrectionDeckelId] = useState<string | null>(null);

  const handleDeckelClick = (id: string) => {
    if (selectedDeckelId === id) {
      // Abwahl
      setSelectedDeckelId(null);
      selectDeckel(''); // Domain-State ebenfalls zurücksetzen
      setSelectedTxId(null);
      return;
    }

    // Auswahl
    setSelectedDeckelId(id);
    selectDeckel(id);
    setSelectedTxId(null);
  };

  const handleStatusChange = (id: string, status: DeckelStatus) => {
    updateDeckelStatus(id, status);
    if (selectedDeckelId === id) {
      selectDeckel(id);
    }
  };

  const openConfirm = (
    type: ConfirmType,
    message: string,
    label: string,
    payload?: string,
    confirmClassName?: string
  ) => {
    setConfirmState({ type, message, label, payload, confirmClassName });
    setModals((m) => ({ ...m, confirm: true }));
  };

  const openDeleteConfirm = () => {
    const deckel = deckelList.find((d) => d.id === selectedDeckelId);
    if (!deckel) return;

    openConfirm(
      'delete',
      `Soll ${deckel.name} wirklich gelöscht werden? Danach is’ er weg.`,
      'Löschen',
      deckel.id
    );
  };

  const executeDelete = () => {
    if (!confirmState.payload) return;
    deleteDeckel(confirmState.payload);
    if (selectedDeckelId === confirmState.payload) setSelectedDeckelId(null);
    closeConfirm();
  };

  const openAbendConfirm = () => {
    openConfirm(
      'abend',
      'Abend wirklich abschließen? Danach kann nichts mehr geändert werden.',
      'Abschließen'
    );
  };

  const executeAbend = () => {
    try {
      // Erstelle Auto-Backup vor dem Abschließen
      saveBackupToLocalStorage();
    } catch (error) {
      console.error('Backup-Fehler:', error);
      // Fortfahren auch wenn Backup fehlschlägt
    }

    abendAbschliessen();
    closeConfirm();
  };

  /**
   * handleCorrectionConfirm
   *
   * - Wenn es Kandidaten (andere Deckel mit gleichem Namen, nicht BEZAHLT) gibt,
   *   öffne das MergeSelectModal und lasse den User ein Ziel wählen (oder "Keinen").
   * - Wenn keine Kandidaten existieren, öffne das normale Confirm (einfacher Pfad).
   */
  const handleCorrectionConfirm = (payload: { removeTxId: string }) => {
    console.log('handleCorrectionConfirm called', { selectedDeckelId, payload });
    if (!selectedDeckelId) return;
    const txId = payload.removeTxId;
    const current = deckelList.find((d) => d.id === selectedDeckelId);
    if (!current) return;

    // Determine root of current deckel and only propose targets with the same root (exclude paid/gone)
    const baseRoot = current.rootKey ?? getRootName(current.name);
    const sameRootCandidates = deckelList.filter(
      (d) =>
        d.id !== selectedDeckelId &&
        (d.rootKey ?? getRootName(d.name)) === baseRoot &&
        d.status !== DECKEL_STATUS.BEZAHLT &&
        d.status !== DECKEL_STATUS.GONE
    );

    if (sameRootCandidates.length === 0) {
      // No same-name candidates -> fallback to normal confirm
      openConfirm('correction', 'Korrektur wirklich durchführen?', 'Korrigieren', txId);
      return;
    }

    // Prepare merge workflow for candidates with same root/name
    setMergeCandidates(sameRootCandidates);
    setPendingCorrectionTxId(txId);
    setPendingCorrectionDeckelId(selectedDeckelId);
    console.log(
      'mergeCandidates set (same root)',
      sameRootCandidates.map((c) => ({ id: c.id, status: c.status }))
    );
    setModals((m) => ({ ...m, mergeCorrection: true }));
  };

  // Open the merge selection modal with a given list of candidates
  const openMergeSelect = (candidates: DeckelUIState[]) => {
    setMergeCandidates(candidates);
    setModals((m) => ({ ...m, mergeSelect: true }));
  };

  /**
   * executeCorrection
   *
   * - targetDeckelId:
   *    - undefined -> normaler Confirm-Pfad (oder Merge fallback)
   *    - string (id) -> merge in diesen Deckel
   *    - null -> explizit "Keinen" gewählt -> separater Gast (wir setzen GONE)
   */
  const executeCorrection = (targetDeckelId?: string | null) => {
    console.log('executeCorrection called', {
      targetDeckelId,
      pendingCorrectionDeckelId,
      pendingCorrectionTxId,
      confirmPayload: confirmState.payload,
    });
    const deckelId = pendingCorrectionDeckelId ?? selectedDeckelId;
    const txId = pendingCorrectionTxId ?? confirmState.payload;
    if (!deckelId || !txId) {
      console.warn('executeCorrection aborted: missing deckelId or txId', { deckelId, txId });
      setModals((m) => ({ ...m, mergeSelect: false, confirm: false }));
      setPendingCorrectionDeckelId(null);
      setPendingCorrectionTxId(null);
      closeConfirm();
      return;
    }

    // Entferne die Transaktion vom korrigierten Deckel
    removeTransaction(deckelId, txId);

    const current = deckelList.find((d) => d.id === deckelId);
    if (!current) {
      console.warn('executeCorrection: current deckel not found', deckelId);
      setModals((m) => ({ ...m, mergeSelect: false, confirm: false }));
      setPendingCorrectionDeckelId(null);
      setPendingCorrectionTxId(null);
      closeConfirm();
      return;
    }

    if (typeof targetDeckelId !== 'undefined') {
      if (targetDeckelId) {
        console.log('Merging into', targetDeckelId);
        if (typeof mergeDeckelInto === 'function') {
          mergeDeckelInto(deckelId, targetDeckelId, txId);
        } else {
          const remainingTxs = (current.transactions ?? []).filter((t) => t.id !== txId);
          for (const tx of remainingTxs) addTransaction(targetDeckelId, { ...tx });
          updateDeckelStatus(deckelId, DECKEL_STATUS.GONE);
        }
        setSelectedDeckelId(targetDeckelId);
        selectDeckel(targetDeckelId);
      } else {
        console.log('User chose: Keinen — separater Gast. Setting GONE for', deckelId);
        updateDeckelStatus(deckelId, DECKEL_STATUS.GONE);
        setSelectedDeckelId(null);
        selectDeckel('');
      }
    } else {
      // normaler Confirm-Pfad
      const other = deckelList.find(
        (d) =>
          d.id !== deckelId &&
          d.name.trim().toLowerCase() === current.name.trim().toLowerCase() &&
          d.status !== DECKEL_STATUS.BEZAHLT
      );
      if (other) {
        if (typeof mergeDeckelInto === 'function') {
          mergeDeckelInto(deckelId, other.id, txId);
        } else {
          const remainingTxs = (current.transactions ?? []).filter((t) => t.id !== txId);
          for (const tx of remainingTxs) addTransaction(other.id, { ...tx });
          updateDeckelStatus(deckelId, DECKEL_STATUS.GONE);
        }
        setSelectedDeckelId(other.id);
        selectDeckel(other.id);
      } else {
        updateDeckelStatus(deckelId, DECKEL_STATUS.OFFEN);
        setSelectedDeckelId(deckelId);
        selectDeckel(deckelId);
      }
    }

    if (selectedTxId === txId) setSelectedTxId(null);

    setModals((m) => ({ ...m, mergeSelect: false, confirm: false }));
    setPendingCorrectionDeckelId(null);
    setPendingCorrectionTxId(null);
    setMergeCandidates([]);
    closeConfirm();
  };

  const handleTransactionConfirm = (amount: number, deckelId?: string) => {
    const targetDeckelId = deckelId ?? selectedDeckelId;
    if (!targetDeckelId) return;
    const tx: Transaction = {
      date: new Date(),
      description: 'Einzahlung',
      count: 1,
      sum: Number(amount),
    };
    addTransaction(targetDeckelId, tx);

    // If a specific deckel was passed and it's different from current selection, select it
    if (deckelId && deckelId !== selectedDeckelId) {
      setSelectedDeckelId(deckelId);
      selectDeckel(deckelId);
    }

    setModals((m) => ({ ...m, transaction: false }));
  };

  const closeConfirm = () => {
    setConfirmState({ type: null, message: '', label: 'Bestätigen', confirmClassName: undefined });
    setModals((m) => ({ ...m, confirm: false }));
  };

  const handlePayConfirm = (
    amount: number,
    deckelId?: string,
    moveToGone?: boolean,
    paymentDetails?: { amountReceived: number; changeGiven: number }
  ) => {
    const targetDeckelId = deckelId ?? selectedDeckelId;
    if (!targetDeckelId) return;

    const deckel = deckelList.find((d) => d.id === targetDeckelId);
    if (!deckel) return;

    // Wenn Rückgeld gegeben wurde, nutze den vollen eingegangenen Betrag
    // Ansonsten nutze den berechneten amount (Netto-Schulden)
    const transactionSum = paymentDetails ? paymentDetails.amountReceived : amount;

    const oldSum = deckel.transactions?.reduce((acc, t) => acc + (t.sum ?? 0), 0) ?? 0;
    const newSum = oldSum + transactionSum;

    const tx: Transaction = {
      date: new Date(),
      description: 'Zahlung',
      count: 1,
      sum: transactionSum,
      // Wenn Rückgeld gegeben wurde, speichere die Details
      ...(paymentDetails && {
        amountReceived: paymentDetails.amountReceived,
        changeGiven: paymentDetails.changeGiven,
      }),
    };

    addTransaction(targetDeckelId, tx);

    // Wenn Rückgeld gegeben wurde, füge auch einen Rückgeld-Eintrag hinzu
    if (paymentDetails && paymentDetails.changeGiven > 0) {
      const changeTx: Transaction = {
        date: new Date(),
        description: `Rückgeld`,
        count: 1,
        sum: -paymentDetails.changeGiven,
      };
      addTransaction(targetDeckelId, changeTx);
    }

    if (newSum === 0 || paymentDetails) {
      // Bei Rückgeld-Zahlung wird Deckel immer als BEZAHLT markiert
      markDeckelAsPaid(targetDeckelId, true);
    } else if (moveToGone) {
      // Wenn Guthaben gewählt wurde, verschiebe Deckel nach GONE
      updateDeckelStatus(targetDeckelId, DECKEL_STATUS.GONE);
    }

    // If a specific deckel was passed and it's different from current selection, select it
    if (deckelId && deckelId !== selectedDeckelId) {
      setSelectedDeckelId(deckelId);
      selectDeckel(deckelId);
    }

    setModals((m) => ({ ...m, pay: false }));
  };

  return {
    handlePayConfirm,
    selectedDeckel,
    selectedDeckelId,
    setSelectedDeckelId,
    selectedTxId,
    setSelectedTxId,
    modals,
    setModals,
    confirmState,
    closeConfirm,
    handleDeckelClick,
    handleStatusChange,
    openDeleteConfirm,
    openAbendConfirm,
    handleCorrectionConfirm,
    handleTransactionConfirm,
    executeDelete,
    // executeCorrection akzeptiert optional targetDeckelId
    executeCorrection,
    executeAbend,
    // Merge flow exports
    mergeCandidates,
    pendingCorrectionDeckelId,
    pendingCorrectionTxId,
    openMergeSelect,
    openConfirm,
  };
};
