// src/app/DeckelScreen.tsx
import React from 'react';

import { useDeckelState } from '../domain/deckelService';

import { GuestList } from './components/GuestList';
import { DeckelTable } from './components/DeckelTable';
import { ProductButtons } from './components/ProductButtons';
import { DeckelFooter } from './components/DeckelFooter';

import { DeckelFormModal } from './DeckelFormModal';
import { TransactionModal } from './TransactionModal';
import { CorrectionModal } from './CorrectionModal';
import { ConfirmModal } from './ConfirmModal';

import deckelBackground from '../assets/Deckelhintergrund.png';
import paidDeckelBackground from '../assets/bezahlt-deckckel.png';
import { useDeckelComputed } from './hooks/useDeckelComputed';
import { useDeckelUIState } from './hooks/useDeckelUIState';
import { useIsMobile } from './hooks/useIsMobile';
import { formatPossessiveCompound } from '../utils/nameUtils';
import { PayDeckelModal } from './PayDeckelModal';

export const DeckelScreen: React.FC = () => {
  const {
    deckelList,
    addDeckel,
    selectDeckel,
    deleteDeckel,
    addTransaction,
    removeTransaction,
    abendAbschliessen,
    isAbendGeschlossen,
    markDeckelAsPaid,
  } = useDeckelState();

  const {
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
    openDeleteConfirm,
    openAbendConfirm,
    handleCorrectionConfirm,
    handleTransactionConfirm,
    handlePayConfirm,

    executeDelete,
    executeCorrection,
    executeAbend,
  } = useDeckelUIState({
    deckelList,
    selectDeckel,
    deleteDeckel,
    removeTransaction,
    abendAbschliessen,
    addTransaction,
    markDeckelAsPaid,
  });

  const {
    isSelectedPresent,
    isReadOnly,
    hasTransactions,
    darfDeckelGezahltWerden,
    totalSum,
    darfKorrigieren,
  } = useDeckelComputed(selectedDeckel, isAbendGeschlossen);

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className='flex items-center justify-center h-screen text-gray-200 text-white text-center p-6'>
        <div>
          <h2 className='text-2xl font-bold mb-4'>Nicht für mobile Geräte geeignet</h2>
          <p className='text-lg text-gray-300'>
            Bitte verwende ein Tablet oder einen Desktop‑Computer, um diese Anwendung zu nutzen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-[100dvh] text-gray-200 text-white'>
      <header className='flex-shrink-0 px-4 pt-4 pb-2 border-b border-gray-300'>
        <h1 className='text-green-600 text-2xl font-bold'>
          Deckelübersicht – {new Date().toLocaleDateString()}
        </h1>
      </header>

      <div className='flex flex-1 flex-col lg:flex-row gap-0 overflow-hidden'>
        <GuestList
          deckelList={deckelList}
          selectedDeckelId={selectedDeckelId}
          onSelect={handleDeckelClick}
          deckelBackground={deckelBackground}
          paidDeckelBackground={paidDeckelBackground}
        />

        <div className='w-full lg:w-2/3 px-4 py-4 overflow-y-auto flex-shrink h-[calc(100dvh-140px)]'>
          {selectedDeckel ? (
            <>
              <h2 className='text-lg font-semibold mb-4'>
                {formatPossessiveCompound(selectedDeckel.name)}
              </h2>

              <DeckelTable
                selectedDeckel={selectedDeckel}
                selectedTxId={selectedTxId}
                setSelectedTxId={setSelectedTxId}
              />

              <ProductButtons
                label='Stubbi'
                icon='/images/strichliste-icons/icon-stubbi.png'
                onAdd={(count) =>
                  addTransaction(selectedDeckel.id, {
                    date: new Date(),
                    description: 'Stubbi',
                    count,
                    sum: -(count * 1.5),
                  })
                }
              />

              <ProductButtons
                label='Helles'
                icon='/images/strichliste-icons/icon-helles.png'
                onAdd={(count) =>
                  addTransaction(selectedDeckel.id, {
                    date: new Date(),
                    description: 'Helles',
                    count,
                    sum: -(count * 2.0),
                  })
                }
              />
            </>
          ) : (
            <p className='text-gray-300 text-xl font-semibold mt-6'>
              Wählen Sie einen Gast aus, um die Details anzuzeigen.
            </p>
          )}
        </div>
      </div>

      <DeckelFooter
        isAbendGeschlossen={isAbendGeschlossen}
        isSelectedPresent={isSelectedPresent}
        selectedDeckel={selectedDeckel}
        isReadOnly={isReadOnly}
        hasTransactions={hasTransactions}
        darfDeckelGezahltWerden={darfDeckelGezahltWerden}
        darfKorrigieren={darfKorrigieren}
        onAddGuest={() => setModals((m) => ({ ...m, addGuest: true }))}
        onDeleteGuest={openDeleteConfirm}
        onOpenEinzahlung={() => setModals((m) => ({ ...m, transaction: true }))}
        onOpenCorrection={() => setModals((m) => ({ ...m, correction: true }))}
        onAbendAbschliessen={openAbendConfirm}
        onPayDeckel={() => setModals((m) => ({ ...m, pay: true }))}
      />

      <DeckelFormModal
        isOpen={modals.addGuest}
        onClose={() => setModals((m) => ({ ...m, addGuest: false }))}
        existingNames={deckelList.map((d) => d.name)}
        onSave={(name) => {
          const newId = addDeckel(name);
          setSelectedDeckelId(newId);
          setModals((m) => ({ ...m, addGuest: false }));
        }}
      />

      <PayDeckelModal
        isOpen={modals.pay}
        onClose={() => setModals((m) => ({ ...m, pay: false }))}
        totalSum={totalSum}
        onConfirm={handlePayConfirm}
      />

      <TransactionModal
        isOpen={modals.transaction}
        onClose={() => setModals((m) => ({ ...m, transaction: false }))}
        presets={[5, 10, 20, 50]}
        onConfirm={handleTransactionConfirm}
      />

      <CorrectionModal
        isOpen={modals.correction}
        onClose={() => setModals((m) => ({ ...m, correction: false }))}
        transactions={selectedDeckel?.transactions ?? []}
        initialSelectedTxId={selectedTxId}
        onConfirm={handleCorrectionConfirm}
      />

      <ConfirmModal
        isOpen={modals.confirm}
        message={confirmState.message}
        confirmLabel={confirmState.label}
        onConfirm={() => {
          if (confirmState.type === 'delete') executeDelete();
          else if (confirmState.type === 'correction') executeCorrection();
          else if (confirmState.type === 'abend') executeAbend();
        }}
        onCancel={closeConfirm}
      />
    </div>
  );
};
