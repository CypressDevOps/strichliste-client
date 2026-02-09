// src/app/hooks/useDeckelUIState.ts
import { useState } from 'react';
import { DeckelUIState, Transaction, DeckelStatus } from '../../domain/models';

interface UIHookProps {
  deckelList: DeckelUIState[];
  selectDeckel: (id: string) => void;
  deleteDeckel: (id: string) => void;
  removeTransaction: (deckelId: string, txId: string) => void;
  abendAbschliessen: () => void;
  addTransaction: (deckelId: string, tx: Transaction) => void;
  markDeckelAsPaid: (id: string, paid?: boolean) => void;
  updateDeckelStatus: (id: string, status: DeckelStatus) => void;
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
  });

  const [confirmState, setConfirmState] = useState<{
    type: ConfirmType;
    message: string;
    label: string;
    payload?: string;
  }>({
    type: null,
    message: '',
    label: 'Bestätigen',
  });

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

  const openConfirm = (type: ConfirmType, message: string, label: string, payload?: string) => {
    setConfirmState({ type, message, label, payload });
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
    abendAbschliessen();
    closeConfirm();
  };

  const handleCorrectionConfirm = (payload: { removeTxId: string }) => {
    openConfirm('correction', 'Korrektur wirklich durchführen?', 'Korrigieren', payload.removeTxId);
  };

  const executeCorrection = () => {
    if (!selectedDeckelId || !confirmState.payload) return;

    removeTransaction(selectedDeckelId, confirmState.payload);
    markDeckelAsPaid(selectedDeckelId, false);

    if (selectedTxId === confirmState.payload) setSelectedTxId(null);

    closeConfirm();
  };

  const handleTransactionConfirm = (amount: number) => {
    if (!selectedDeckelId) return;
    const tx: Transaction = {
      date: new Date(),
      description: 'Einzahlung',
      count: 1,
      sum: Number(amount),
    };
    addTransaction(selectedDeckelId, tx);
  };

  const closeConfirm = () => {
    setConfirmState({ type: null, message: '', label: 'Bestätigen' });
    setModals((m) => ({ ...m, confirm: false }));
  };

  const handlePayConfirm = (amount: number) => {
    if (!selectedDeckelId) return;

    const deckel = deckelList.find((d) => d.id === selectedDeckelId);
    if (!deckel) return;

    const oldSum = deckel.transactions?.reduce((acc, t) => acc + (t.sum ?? 0), 0) ?? 0;
    const newSum = oldSum + amount;

    const tx: Transaction = {
      date: new Date(),
      description: 'Zahlung',
      count: 1,
      sum: amount,
    };

    addTransaction(selectedDeckelId, tx);

    if (newSum === 0) {
      markDeckelAsPaid(selectedDeckelId, true);
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
    executeCorrection,
    executeAbend,
  };
};
