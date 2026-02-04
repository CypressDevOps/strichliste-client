// src/app/DeckelScreen.tsx
import React, { useEffect, useState } from 'react';
import { DeckelFormModal } from './DeckelFormModal';
import { ConfirmModal } from './ConfirmModal';
import { TransactionModal } from './TransactionModal';
import { CorrectionModal } from './CorrectionModal';
import deckelBackground from '../assets/Deckelhintergrund.png';
import paidDeckelBackground from '../assets/bezahlt-deckckel.png';
import { useDeckelState } from '../domain/deckelService';
import { formatPossessiveCompound } from '../utils/nameUtils';
import { DECKEL_STATUS, Transaction } from '../domain/models';

export const DeckelScreen: React.FC = () => {
  const {
    deckelList,
    addDeckel,
    selectDeckel,
    deleteDeckel, // ← HIER MUSS ES SEIN
    addTransaction,
    removeTransaction,
    abendAbschliessen,
    isAbendGeschlossen,
    markDeckelAsPaid,
    darfDeckelGezahltWerden,
  } = useDeckelState();

  const [isMobile, setIsMobile] = useState(false);
  const [selectedDeckelId, setSelectedDeckelId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Transaction Modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  // Correction Modal state
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [pendingCorrection, setPendingCorrection] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingAbend, setPendingAbend] = useState(false);
  // Confirm Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Selected transaction id (for row selection)
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const [confirmLabel, setConfirmLabel] = useState('Bestätigen');

  // true, wenn die aktuell ausgewählte ID noch in der Liste existiert
  const isSelectedPresent = selectedDeckelId
    ? deckelList.some((d) => d.id === selectedDeckelId)
    : false;

  const selectedDeckel = deckelList.find((d) => d.isSelected);
  const isReadOnly = selectedDeckel?.status === DECKEL_STATUS.BEZAHLT;
  // true, wenn mindestens eine Transaktion vorhanden ist (für Korrektur-Button)
  const hasTransactions = selectedDeckel?.transactions?.some((t) => !!t.id) ?? false;
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile(); // direkt beim Start prüfen
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const executeCorrection = () => {
    if (!selectedDeckelId || !pendingCorrection) return;

    removeTransaction(selectedDeckelId, pendingCorrection);

    if (selectedTxId === pendingCorrection) {
      setSelectedTxId(null);
    }

    setPendingCorrection(null);
    setIsConfirmOpen(false);
  };

  const executeDelete = () => {
    if (!pendingDelete) return;

    deleteDeckel(pendingDelete);

    if (selectedDeckelId === pendingDelete) {
      setSelectedDeckelId(null);
    }

    setPendingDelete(null);
    setIsConfirmOpen(false);
  };

  const handleDeckelClick = (id: string) => {
    if (selectedDeckelId === id) {
      setSelectedDeckelId(null);
      selectDeckel('');
    } else {
      setSelectedDeckelId(id);
      selectDeckel(id);
    }
    setSelectedTxId(null);
  };

  const openDeleteConfirm = () => {
    if (!selectedDeckel) return;

    setConfirmMessage(`Soll ${selectedDeckel.name} wirklich gelöscht werden? Danach is’ er weg.`);
    setConfirmLabel('Löschen');
    setPendingDelete(selectedDeckel.id); // ← WICHTIG
    setIsConfirmOpen(true);
  };

  const openAbendConfirm = () => {
    setConfirmMessage('Abend wirklich abschließen? Danach kann nichts mehr geändert werden.');
    setPendingAbend(true);
    setIsConfirmOpen(true);
  };

  const executeAbend = () => {
    abendAbschliessen();
    setPendingAbend(false);
    setIsConfirmOpen(false);
  };

  // --- Hilfsfunktionen für Tabelle ---
  const formatDate = (d?: Date | string) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString();
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',') + ' €';
  };

  // Totals für die Fußzeile
  const totalCount = selectedDeckel?.transactions?.reduce((acc, t) => acc + (t.count ?? 0), 0) ?? 0;
  const totalSum = selectedDeckel?.transactions?.reduce((acc, t) => acc + (t.sum ?? 0), 0) ?? 0;

  // Handler für Korrektur-Confirm
  const handleCorrectionConfirm = (payload: { removeTxId: string }) => {
    if (!selectedDeckelId) return;

    setConfirmMessage('Korrektur wirklich durchführen?');
    setPendingCorrection(payload.removeTxId); // merken, was gelöscht werden soll
    setIsConfirmOpen(true);
  };

  // Handler für TransactionModal confirm (Einzahlung)
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
          Deckelübersicht - {new Date().toLocaleDateString()}
        </h1>
      </header>
      {/* Linke  Spalte: Gästeübersicht */}
      <div className='flex flex-1 flex-col lg:flex-row gap-0 overflow-hidden'>
        <div className='w-full lg:w-1/3 ... overflow-y-auto h-[calc(100dvh-140px)]'>
          <h2 className='text-lg font-semibold mb-4 pl-4'>Gäste</h2>
          {deckelList.length === 0 ? (
            <p className='text-gray-300 text-center mt-8'>Kein Gast im Schützenverein 🎯</p>
          ) : (
            <ul className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {deckelList.map((deckel) => (
                <li
                  key={deckel.id}
                  className='flex flex-col items-start cursor-pointer'
                  onClick={() => handleDeckelClick(deckel.id)}
                >
                  <div className='pl-4'>
                    <span className='mb-2 text-yellow-300 text-xl font-semibold'>
                      {deckel.name}
                    </span>

                    <div
                      className='w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-lg overflow-hidden relative flex-shrink-0'
                      style={{
                        backgroundImage: `url(${
                          deckel.status === DECKEL_STATUS.BEZAHLT
                            ? paidDeckelBackground
                            : deckelBackground
                        })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      {selectedDeckelId === deckel.id && (
                        <div className='absolute inset-0 bg-blue-950/70 rounded-lg pointer-events-none'></div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rechte Spalte: tabellarische Detailansicht */}
        <div className='w-full lg:w-2/3 px-4 py-4 overflow-y-auto flex-shrink h-[calc(100dvh-140px)]'>
          <div className='h-full'>
            {deckelList.length === 0 ? (
              <div />
            ) : selectedDeckelId && selectedDeckel ? (
              <div>
                <h2 className='text-lg font-semibold mb-4'>
                  {formatPossessiveCompound(selectedDeckel.name, ' - Deckel')}
                </h2>

                <div className='bg-white/5 rounded-lg p-4'>
                  <table className='w-full table-fixed text-left'>
                    <thead>
                      <tr className='text-sm text-gray-300 border-b border-gray-700'>
                        <th className='py-2 px-2 w-1/6'>Datum</th>
                        <th className='py-2 px-2 w-2/3'>Bezeichnung</th>
                        <th className='py-2 px-2 w-1/12 text-right'>Anzahl</th>
                        <th className='py-2 px-2 w-1/6 text-right'>Summe</th>
                      </tr>
                    </thead>

                    <tbody>
                      {!selectedDeckel.transactions || selectedDeckel.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className='py-6 text-center text-gray-300'>
                            Keine Einträge vorhanden.
                          </td>
                        </tr>
                      ) : (
                        selectedDeckel.transactions.map((t) => {
                          const isSelected = selectedTxId === t.id;
                          return (
                            <tr
                              key={t.id ?? `${t.date}-${t.description}`}
                              className={`border-b border-gray-800 cursor-pointer ${isSelected ? 'bg-white/5' : ''}`}
                              onClick={() =>
                                setSelectedTxId((cur) => (cur === t.id ? null : (t.id ?? null)))
                              }
                            >
                              <td className='py-2 px-2 text-sm text-gray-300'>
                                {formatDate(t.date)}
                              </td>

                              <td className='py-2 px-2 text-sm text-gray-300'>{t.description}</td>

                              <td className='py-2 px-2 text-sm text-gray-300 text-right'>
                                {t.count}
                              </td>

                              <td className='py-2 px-2 text-sm text-gray-300 text-right'>
                                {t.sum < 0 ? (
                                  <span className='text-red-400 font-semibold'>
                                    {formatCurrency(t.sum)}
                                  </span>
                                ) : t.sum > 0 ? (
                                  <span className='text-green-400 font-semibold'>
                                    +{formatCurrency(t.sum)}
                                  </span>
                                ) : (
                                  <span>{formatCurrency(t.sum)}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>

                    <tfoot>
                      <tr className='border-t border-gray-700'>
                        <td className='py-3 px-2 font-semibold'>Gesamtergebnis</td>
                        <td className='py-3 px-2' />
                        <td className='py-3 px-2 text-right font-semibold'>{totalCount}</td>
                        <td className='py-3 px-2 text-right font-semibold'>
                          {totalSum < 0 ? (
                            <span className='text-red-400'>{formatCurrency(totalSum)}</span>
                          ) : totalSum > 0 ? (
                            <span className='text-green-400'>+{formatCurrency(totalSum)}</span>
                          ) : (
                            <span>{formatCurrency(totalSum)}</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className='flex flex-col items-center gap-2 mt-4'>
                    <div className='text-xl font-bold'>Stubbi</div>

                    <div className='flex gap-3 items-center'>
                      {/* Produkt-Icon (nicht klickbar) */}
                      <div className='w-20 h-20 flex items-center justify-center'>
                        <img
                          src='/images/strichliste-icons/icon-stubbi.png'
                          alt='Stubbi Produkt Icon'
                          className='w-20 h-20 opacity-90'
                        />
                      </div>

                      {/* 5 klickbare Icons */}
                      {[1, 2, 3, 4, 5].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            if (!selectedDeckel) return;

                            addTransaction(selectedDeckel.id, {
                              date: new Date(),
                              description: 'Stubbi',
                              count,
                              sum: -(count * 1.5),
                            });
                          }}
                          className='w-20 h-20 bg-transparent rounded flex items-center justify-center hover:scale-105 active:scale-95 transition'
                        >
                          <img
                            src={`/images/strichliste-icons/strich-${count}.png`}
                            alt={`Helles ${count}`}
                            className='w-16 h-16'
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className='flex flex-col items-center gap-2 mt-4'>
                    <div className='text-xl font-bold'>Helles</div>

                    <div className='flex gap-3 items-center'>
                      {/* Produkt-Icon (nicht klickbar) */}
                      <div className='w-20 h-20 flex items-center justify-center'>
                        <img
                          src='/images/strichliste-icons/icon-helles.png'
                          alt='Helles Produkt Icon'
                          className='w-15 h-15 opacity-90'
                        />
                      </div>

                      {/* 5 klickbare Icons */}
                      {[1, 2, 3, 4, 5].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            if (!selectedDeckel) return;

                            addTransaction(selectedDeckel.id, {
                              date: new Date(),
                              description: 'Helles',
                              count,
                              sum: -(count * 2.0),
                            });
                          }}
                          className='w-20 h-20 bg-transparent rounded flex items-center justify-center hover:scale-105 active:scale-95 transition'
                        >
                          <img
                            src={`/images/strichliste-icons/strich-${count}.png`}
                            alt={`Stubbi ${count}`}
                            className='w-16 h-16'
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className='text-gray-300'>Wählen Sie einen Gast aus, um die Details anzuzeigen.</p>
            )}
          </div>
        </div>
      </div>

      <footer className='flex-shrink-0 flex justify-between items-center gap-4 border-t border-gray-700 px-4 py-3 overflow-x-hidden'>
        {/* Linke Seite */}
        <div className='flex items-center gap-3'>
          <button
            onClick={() => !isAbendGeschlossen && setIsModalOpen(true)}
            disabled={isAbendGeschlossen}
            className={`px-6 py-3 text-lg font-bold rounded shadow transition ${
              !isAbendGeschlossen
                ? 'bg-green-600 text-white hover:bg-green-800'
                : 'bg-green-900/30 text-white/60 cursor-not-allowed'
            }`}
          >
            Gast hinzufügen
          </button>

          <button
            onClick={openDeleteConfirm}
            disabled={!isSelectedPresent || isAbendGeschlossen}
            className={`px-5 py-3 text-lg font-bold rounded shadow transition ${
              isSelectedPresent && !isAbendGeschlossen
                ? 'bg-red-800 text-white hover:bg-red-900'
                : 'bg-red-900/30 text-white/60 cursor-not-allowed'
            }`}
          >
            Gast entfernen
          </button>
        </div>

        {/* Rechte Seite */}
        <div className='flex items-center gap-2 flex-wrap justify-end max-w-full mr-10'>
          <button
            onClick={() => {
              if (!isReadOnly && !isAbendGeschlossen) {
                setIsTransactionModalOpen(true);
              }
            }}
            disabled={
              isReadOnly || // ← NEU
              !isSelectedPresent ||
              selectedDeckel?.status !== DECKEL_STATUS.OFFEN ||
              isAbendGeschlossen
            }
            className={`px-4 py-2 text-base font-bold rounded shadow transition ${
              isReadOnly
                ? 'bg-blue-900/30 text-white/60 opacity-50 pointer-events-none' // ← NEU
                : isSelectedPresent &&
                    selectedDeckel?.status === DECKEL_STATUS.OFFEN &&
                    !isAbendGeschlossen
                  ? 'bg-blue-600 text-white hover:bg-blue-800'
                  : 'bg-blue-900/30 text-white/60 cursor-not-allowed'
            }`}
          >
            Einzahlung
          </button>

          <button
            onClick={() => selectedDeckel && markDeckelAsPaid(selectedDeckel.id)}
            disabled={!selectedDeckel || !darfDeckelGezahltWerden}
            className={`px-5 py-2 font-bold text-base rounded shadow transition ${
              selectedDeckel && darfDeckelGezahltWerden
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-green-900/30 text-white/60 cursor-not-allowed'
            }`}
          >
            Deckel zahlen
          </button>

          <button
            onClick={() => !isAbendGeschlossen && setIsCorrectionModalOpen(true)}
            disabled={
              !isSelectedPresent ||
              selectedDeckel?.status !== DECKEL_STATUS.OFFEN ||
              !hasTransactions ||
              isAbendGeschlossen
            }
            className={`px-4 py-2 text-base font-bold rounded shadow transition ${
              isSelectedPresent &&
              selectedDeckel?.status === DECKEL_STATUS.OFFEN &&
              hasTransactions &&
              !isAbendGeschlossen
                ? 'bg-red-800 text-white hover:bg-red-900'
                : 'bg-red-900/30 text-white/60 cursor-not-allowed'
            }`}
          >
            Korrektur
          </button>

          <button
            onClick={openAbendConfirm}
            disabled={isAbendGeschlossen}
            className={`px-5 py-2 font-bold text-base rounded shadow transition ${
              !isAbendGeschlossen
                ? 'bg-yellow-300 text-blue-950 hover:bg-yellow-400'
                : 'bg-yellow-900/30 text-white/60 cursor-not-allowed'
            }`}
          >
            Abend abschließen
          </button>
        </div>
      </footer>

      <DeckelFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingNames={deckelList.map((d) => d.name)}
        onSave={(name: string) => {
          const newId = addDeckel(name);
          setSelectedDeckelId(newId);
          setIsModalOpen(false);
        }}
      />

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        presets={[5, 10, 20, 50]}
        onConfirm={handleTransactionConfirm}
      />

      {/* Correction Modal */}
      <CorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        transactions={selectedDeckel?.transactions ?? []}
        initialSelectedTxId={selectedTxId}
        onConfirm={handleCorrectionConfirm}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        onConfirm={() => {
          if (pendingDelete) executeDelete();
          else if (pendingCorrection) executeCorrection();
          else if (pendingAbend) executeAbend();
        }}
        onCancel={() => {
          setPendingDelete(null);
          setPendingCorrection(null);
          setPendingAbend(false);
          setIsConfirmOpen(false);
        }}
      />
    </div>
  );
};
