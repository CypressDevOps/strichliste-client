// src/app/DeckelScreen.tsx
import React, { useState } from 'react';

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
import { PayDeckelModal } from './PayDeckelModal';
import MergeCorrectionModal from './MergeCorrectionModal';
import { DECKEL_STATUS } from '../domain/models';
import {
  toDeckelForm,
  nextDisplayName,
  getRootName,
  baseNameFromPossessive,
} from '../utils/nameUtils';

export const DeckelScreen: React.FC = () => {
  const [pendingAddName, setPendingAddName] = useState<string | null>(null);
  const [pendingAddOwnerId, setPendingAddOwnerId] = useState<string | null>(null);
  const [isAddingDeckel, setIsAddingDeckel] = useState(false);

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
    updateDeckelStatus,
    mergeDeckelInto,
    mergeCorrectionIntoDeckel,
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
    handleStatusChange,
    executeDelete,
    executeCorrection,
    executeAbend,
    mergeCandidates,
    pendingCorrectionDeckelId,
    pendingCorrectionTxId,
    openConfirm,
  } = useDeckelUIState({
    deckelList,
    selectDeckel,
    deleteDeckel,
    removeTransaction,
    abendAbschliessen,
    addTransaction,
    markDeckelAsPaid,
    updateDeckelStatus,
    mergeDeckelInto, // wird intern für automatisches Merge verwendet
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

  // --- WICHTIG: nur nicht-bezahlte Namen an das Modal übergeben
  const existingActiveNames = deckelList.filter((d) => d.status !== 'BEZAHLT').map((d) => d.name);

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
          onStatusChange={handleStatusChange}
        />

        <div className='hidden lg:block w-px bg-gray-300' />
        <div className='block lg:hidden h-px bg-gray-300' />

        <div className='w-full lg:w-2/3 px-4 py-4 overflow-y-auto flex-shrink h-[calc(100dvh-140px)]'>
          {selectedDeckel ? (
            <>
              <h2 className='text-lg font-semibold mb-4'>{selectedDeckel.name}</h2>

              <DeckelTable
                selectedDeckel={selectedDeckel}
                selectedTxId={selectedTxId}
                setSelectedTxId={setSelectedTxId}
              />

              <img
                src='/images/strichliste-icons/alc-icon.png'
                alt='Getränke'
                title='Bier, Cola, Schnaps'
                className='mt-4 w-15 h-15 mx-auto opacity-60'
              />

              <ProductButtons
                label='Stubbi'
                icon='/images/strichliste-icons/icon-stubbi.png'
                onAdd={(count) => {
                  if (!isReadOnly) {
                    addTransaction(selectedDeckel.id, {
                      date: new Date(),
                      description: 'Stubbi',
                      count,
                      sum: -(count * 1.5),
                    });
                  }
                }}
              />

              <ProductButtons
                label='Helles'
                icon='/images/strichliste-icons/icon-helles.png'
                onAdd={(count) => {
                  if (!isReadOnly) {
                    addTransaction(selectedDeckel.id, {
                      date: new Date(),
                      description: 'Helles',
                      count,
                      sum: -(count * 2.0),
                    });
                  }
                }}
              />
            </>
          ) : deckelList.length > 0 ? (
            <p className='text-gray-300 text-xl font-semibold mt-6'>
              Wählen Sie einen Gast aus, um die Details anzuzeigen.
            </p>
          ) : null}
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
        existingNames={existingActiveNames}
        onSave={(name, useSameOwner) => {
          if (isAddingDeckel) {
            console.warn('onSave: already adding, ignoring duplicate call');
            return;
          }
          setIsAddingDeckel(true);

          try {
            let ownerIdToUse: string | undefined = undefined;
            // Possessiv-Basis (ohne "Deckel"), z. B. "Jannis"
            const baseForMatch = toDeckelForm(name.trim());
            const baseRoot = getRootName(baseForMatch);

            // Comprehensive debug logs for matching
            console.log('=== onSave START ===');
            console.log('input name:', name);
            console.log('baseForMatch:', baseForMatch, 'baseRoot:', baseRoot);
            console.log(
              'existing names:',
              deckelList.map((d) => d.name)
            );
            console.log(
              'existing roots:',
              deckelList.map((d) => d.rootKey ?? getRootName(d.name))
            );

            // Check if a guest with the same root name already exists (any status)
            const existingWithSameName = deckelList.filter((d) => {
              const existingRoot = d.rootKey ?? getRootName(d.name);
              return existingRoot === baseRoot;
            });

            if (existingWithSameName.length > 0) {
              // Show confirm dialog asking if user really wants to create another guest with the same name
              setPendingAddName(baseForMatch);
              setPendingAddOwnerId(null);
              const basePlain = baseNameFromPossessive(baseForMatch);
              openConfirm(
                'delete',
                `"${basePlain}" existiert bereits. Neuen Gast trotzdem anlegen?`,
                'Ja, erstellen',
                'ADD_DUPLICATE_CONFIRM',
                'bg-green-600 text-white rounded hover:bg-green-700'
              );
              setModals((m) => ({ ...m, confirm: true }));
              console.log('=== onSave END (duplicate name confirm) ===');
              setIsAddingDeckel(false);
              return;
            }

            if (useSameOwner) {
              // Suche Match per Root (robust)
              const match = deckelList.find((d) => {
                const existingRoot = d.rootKey ?? getRootName(d.name);
                return existingRoot === baseRoot && d.status !== DECKEL_STATUS.BEZAHLT;
              });

              console.log('useSameOwner=true, match found:', !!match, match?.name);

              if (match) {
                const saldo = (match.transactions ?? []).reduce((s, t) => s + (t.sum ?? 0), 0);
                console.log('match saldo:', saldo);

                if (saldo === 0) {
                  // Berechne finale Anzeigeform für Confirm
                  const displayForPending = nextDisplayName(baseForMatch, deckelList);

                  console.log('match found (saldo 0). match.name:', match.name);
                  console.log('displayForPending:', displayForPending);

                  setPendingAddName(displayForPending);
                  setPendingAddOwnerId(match.ownerId ?? match.id);
                  openConfirm(
                    'delete',
                    `Es existiert bereits ein aktiver Deckel "${match.name}" mit Saldo 0. Möchtest du trotzdem verknüpfen?`,
                    'Verknüpfen',
                    'ADD_MERGE_WARN'
                  );
                  setModals((m) => ({ ...m, confirm: true }));
                  console.log('=== onSave END (merge confirm) ===');
                  setIsAddingDeckel(false);
                  return;
                }

                // sonst: direkt verknüpfen mit ownerId des Matches
                ownerIdToUse = match.ownerId ?? match.id;
                console.log('match found (saldo !== 0), using ownerIdToUse:', ownerIdToUse);
              } else {
                console.log('no match found');
              }
            }

            // Do NOT open merge modal during guest creation.
            // Simply create the new deckel (possibly numbered) and select it.
            console.log(
              'calling addDeckel with baseForMatch:',
              baseForMatch,
              'ownerIdToUse:',
              ownerIdToUse
            );
            const newId = addDeckel(baseForMatch, ownerIdToUse);
            console.log('addDeckel returned newId:', newId);
            console.log('=== onSave END (add guest) ===');

            setSelectedDeckelId(newId);
            setModals((m) => ({ ...m, addGuest: false }));
          } finally {
            // Always reset guard to allow future submissions
            setIsAddingDeckel(false);
          }
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
        title={confirmState.type === 'correction' ? 'Korrektur bestätigen' : undefined}
        message={confirmState.message}
        confirmLabel={confirmState.label}
        confirmClassName={confirmState.confirmClassName}
        showSavedInfo={false} // deaktiviert "Gespeicherte Information"
        onConfirm={() => {
          // Handle special confirm payloads
          if (confirmState.payload === 'ADD_MERGE_WARN') {
            if (pendingAddName) {
              const newId = addDeckel(pendingAddName, pendingAddOwnerId ?? undefined);
              setSelectedDeckelId(newId);
              setPendingAddName(null);
              setPendingAddOwnerId(null);
              setModals((m) => ({ ...m, addGuest: false, confirm: false }));
              setIsAddingDeckel(false);
              return;
            }
          } else if (confirmState.payload === 'ADD_DUPLICATE_CONFIRM') {
            // User confirmed they want to create a guest with a duplicate name
            if (pendingAddName) {
              const newId = addDeckel(pendingAddName, undefined);
              setSelectedDeckelId(newId);
              setPendingAddName(null);
              setPendingAddOwnerId(null);
              setModals((m) => ({ ...m, addGuest: false, confirm: false }));
              setIsAddingDeckel(false);
              return;
            }
          }

          // Standardpfade
          if (confirmState.type === 'delete') executeDelete();
          else if (confirmState.type === 'correction') executeCorrection();
          else if (confirmState.type === 'abend') executeAbend();
        }}
        onCancel={() => {
          // Falls ein spezieller Pending‑Zustand existiert, aufräumen
          if (confirmState.payload === 'ADD_MERGE_WARN') {
            setPendingAddName(null);
            setPendingAddOwnerId(null);
            setIsAddingDeckel(false);
          }
          closeConfirm();
        }}
      />

      {/* MergeSelectModal removed: merge-on-create flow disabled. Guests are always added as new deckels. */}

      {modals.mergeCorrection && (
        <MergeCorrectionModal
          candidates={mergeCandidates}
          sourceId={pendingCorrectionDeckelId ?? ''}
          onMerge={(targetId, options) => {
            if (!pendingCorrectionDeckelId) return;
            const res = mergeCorrectionIntoDeckel(targetId, pendingCorrectionDeckelId, {
              note: options?.note,
              excludeTxId: pendingCorrectionTxId ?? undefined,
            });
            console.log('mergeCorrectionIntoDeckel result:', res);
            if (res.success) {
              setSelectedDeckelId(res.targetId ?? targetId);
              setModals((m) => ({ ...m, mergeCorrection: false, correction: false }));
            } else {
              console.warn('Merge correction failed:', res.message);
            }
          }}
          onCreateNew={(name) => {
            const newId = addDeckel(name || toDeckelForm(''), undefined);
            setSelectedDeckelId(newId);
            setModals((m) => ({ ...m, mergeCorrection: false, correction: false }));
          }}
          onCancel={() => {
            setModals((m) => ({ ...m, mergeCorrection: false }));
          }}
        />
      )}
    </div>
  );
};
