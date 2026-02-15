// src/app/DeckelScreen.tsx
import React, { useState, useEffect, useRef } from 'react';

import { useDeckelState } from '../domain/deckelService';
import { productService } from '../domain/productService';
import { Product, ProductCategory, GastBeleg } from '../domain/models';

import { GuestList } from './components/GuestList';
import { DeckelTable } from './components/DeckelTable';
import { CategorySelector } from './components/CategorySelector';
import { ProductGrid } from './components/ProductGrid';
import { DeckelFooter } from './components/DeckelFooter';
import { DailySalesOverview } from './components/DailySalesOverview';

import { DeckelFormModal } from './DeckelFormModal';
import { TransactionModal } from './TransactionModal';
import { CorrectionModal } from './CorrectionModal';
import { ConfirmModal } from './ConfirmModal';
import CashierModal from './CashierModal';
import DeckeltransferModal from './DeckeltransferModal';

import { useDeckelComputed } from './hooks/useDeckelComputed';
import { useDeckelUIState } from './hooks/useDeckelUIState';
import { useIsMobile } from './hooks/useIsMobile';
import { PayDeckelModal } from './PayDeckelModal';
import MergeCorrectionModal from './MergeCorrectionModal';
import { AdminModal } from './AdminModal';
import { BusinessInfoModal } from './BusinessInfoModal';
import { CashReportModal } from './CashReportModal';
import { DeckelOverviewModal } from './DeckelOverviewModal';
import { EmergencyOverrideModal } from './EmergencyOverrideModal';
import { BackupImportModal } from './BackupImportModal';
import { MonthlyReportModal } from './MonthlyReportModal';
import { BelegSelectModal } from './BelegSelectModal';
import { BeerClickerGame } from './BeerClickerGame';
import { ReceiptModal } from './ReceiptModal';
import { generateReceipt } from '../domain/receiptGenerator';
import { loadBusinessInfo } from '../domain/businessInfoService';
import { GameMenu } from './GameMenu';
import { Game2048 } from './Game2048';
import { DeutschlandQuiz } from './DeutschlandQuiz';
import { DECKEL_STATUS } from '../domain/models';
import {
  toDeckelForm,
  nextDisplayName,
  getRootName,
  baseNameFromPossessive,
} from '../utils/nameUtils';
import {
  exportBackup,
  shouldRestoreFromBackup,
  restoreFromLocalBackup,
} from '../utils/backupService';
import { OfflineIndicator } from '../components/OfflineIndicator';

export const DeckelScreen: React.FC = () => {
  const [businessInfo, setBusinessInfo] = useState(() => loadBusinessInfo());
  const [isRestoring, setIsRestoring] = useState(false);
  const [pendingAddName, setPendingAddName] = useState<string | null>(null);
  const [pendingAddOwnerId, setPendingAddOwnerId] = useState<string | null>(null);
  const [isAddingDeckel, setIsAddingDeckel] = useState(false);
  const [cassierModalOpen, setCassierModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isAddingProductTransaction, setIsAddingProductTransaction] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isBusinessInfoOpen, setIsBusinessInfoOpen] = useState(false);
  const [isCashReportOpen, setIsCashReportOpen] = useState(false);
  const [isDeckelOverviewOpen, setIsDeckelOverviewOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [isEmergencyOverrideOpen, setIsEmergencyOverrideOpen] = useState(false);
  const [emergencyOverrideActive, setEmergencyOverrideActive] = useState(false);
  const [isBackupImportOpen, setIsBackupImportOpen] = useState(false);
  const [isTechMenuOpen, setIsTechMenuOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isPdfSubmenuOpen, setIsPdfSubmenuOpen] = useState(false);
  const [isBelegSelectOpen, setIsBelegSelectOpen] = useState(false);

  // Easter Egg Game States
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isBeerGameOpen, setIsBeerGameOpen] = useState(false);
  const [is2048Open, setIs2048Open] = useState(false);
  const [isDeutschlandQuizOpen, setIsDeutschlandQuizOpen] = useState(false);

  // Quittungs-Test States
  const [isReceiptTestOpen, setIsReceiptTestOpen] = useState(false);
  const [testReceipt, setTestReceipt] = useState<GastBeleg | null>(null);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');

  // Für 5x Tap auf Titel
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Für 8x Tap auf Datum (Easter Egg)
  const dateEasterEggCountRef = useRef(0);
  const dateEasterEggTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitleTap = () => {
    tapCountRef.current += 1;

    // Timer zurücksetzen
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    // Nach 2 Sekunden Counter zurücksetzen
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);

    // Bei 5 Taps: Technisches Menü öffnen
    if (tapCountRef.current === 5) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
      setIsTechMenuOpen(true);
    }
  };

  const handleDateEasterEggTap = () => {
    dateEasterEggCountRef.current += 1;

    // Timer zurücksetzen
    if (dateEasterEggTimerRef.current) {
      clearTimeout(dateEasterEggTimerRef.current);
    }

    // Nach 2 Sekunden Counter zurücksetzen
    dateEasterEggTimerRef.current = setTimeout(() => {
      dateEasterEggCountRef.current = 0;
    }, 2000);

    // Bei 8 Taps: Game Menu öffnen! 🎮
    if (dateEasterEggCountRef.current === 8) {
      dateEasterEggCountRef.current = 0;
      if (dateEasterEggTimerRef.current) {
        clearTimeout(dateEasterEggTimerRef.current);
      }
      setIsGameMenuOpen(true);
    }
  };

  /**
   * Test-Funktion: Generiert eine Test-Quittung zum Testen der UI
   */
  const testReceiptGeneration = async () => {
    try {
      if (!selectedDeckel) {
        setDebugMessage('Bitte wählen Sie einen Gast aus, um die Quittung zu erstellen');
        setDebugModalOpen(true);
        return;
      }

      // Quittung kann nur erstellt werden, wenn der Gast bereits bezahlt hat
      if (selectedDeckel.status !== DECKEL_STATUS.BEZAHLT) {
        setDebugMessage(
          `Quittung kann nur erstellt werden, wenn der Gast bezahlt hat.\nAktueller Status: ${selectedDeckel.status}`
        );
        setDebugModalOpen(true);
        return;
      }

      // Nur negative Transaktionen (Verkäufe/Schulden) summieren, nicht die Bezahlungen
      const transactions = selectedDeckel.transactions || [];
      const salesTransactions = transactions.filter((tx) => tx.sum < 0);

      if (salesTransactions.length === 0) {
        setDebugMessage('Gast hat keine Verkäufe - Quittung kann nicht erstellt werden');
        setDebugModalOpen(true);
        return;
      }

      // Erstelle Tax-Rate-Map basierend auf Produktkategorie
      // Snacks = 7%, alles andere = 19%
      const taxRateMap = new Map<string, number>();
      for (const product of products) {
        const taxRate = product.category === 'Snacks' ? 7 : 19;
        taxRateMap.set(product.name, taxRate);
      }

      // tx.sum sind bereits BRUTTO-Preise (was der Gast sieht & bezahlt!)
      const totalGrossToPay = Math.abs(salesTransactions.reduce((sum, tx) => sum + tx.sum, 0));

      // Aufrunden auf nächste 0,50€ für Rückgeld
      const amountReceived = Math.ceil(totalGrossToPay * 2) / 2;

      // Debug: Info über Transaktionen anzeigen
      const debugInfo = `
DEBUG INFO:
- Gast: ${selectedDeckel.name}
- Status: ${selectedDeckel.status}
- Alle Transaktionen: ${transactions.length}
- Nur Verkäufe (negativ): ${salesTransactions.length}
- Gesamtsumme (BRUTTO): ${totalGrossToPay.toFixed(2)}€
- Zahlbetrag (aufgerundet): ${amountReceived.toFixed(2)}€

Steuersätze:
${Array.from(taxRateMap.entries())
  .map(([name, rate]) => `  - ${name}: ${rate}%`)
  .join('\n')}

Transaktionen (Brutto-Preise):
${salesTransactions.map((tx) => `  - ${tx.description}: ${tx.sum.toFixed(2)}€`).join('\n')}
      `.trim();

      console.log(debugInfo);

      // Finde Rückgeld- und Trinkgeld-Transaktionen
      const changeTransaction = (selectedDeckel?.transactions || []).find(
        (tx) => tx.description === 'Rückgeld'
      );
      const tipTransaction = (selectedDeckel?.transactions || []).find(
        (tx) => tx.isTip === true || tx.description === 'Trinkgeld'
      );

      const changeGiven = Math.abs(changeTransaction?.sum ?? 0); // Rückgeld ist negativ
      let tip: number | undefined = Math.abs(tipTransaction?.sum ?? 0); // Trinkgeld ist negativ
      if (tip === 0) tip = undefined;

      // Berechne amountReceived: totalGross + changeGiven + (tip || 0)
      const amountReceivedCalculated = totalGrossToPay + changeGiven + (tip || 0);

      // Debug
      console.log('DeckelScreen - Payment Details:', {
        totalGrossToPay: totalGrossToPay,
        changeGiven: changeGiven,
        tip: tip,
        amountReceived: amountReceivedCalculated,
      });

      const receipt = await generateReceipt({
        business: loadBusinessInfo(), // Lade aus localStorage
        transactions: salesTransactions, // Nur Verkäufe an die Quittung
        paymentMethod: 'CASH',
        paymentDetails: { amountReceived: amountReceivedCalculated, changeGiven, tip },
        guestName: selectedDeckel.name,
        tableNumber: selectedDeckel.id,
        taxRateMap, // Übergebe das Steuersatz-Mapping
      });
      setTestReceipt(receipt);
      setIsReceiptTestOpen(true);
    } catch (error) {
      const salesTransactions = (selectedDeckel?.transactions || []).filter((tx) => tx.sum < 0);
      const totalGrossToPay = Math.abs(salesTransactions.reduce((sum, tx) => sum + tx.sum, 0));
      const amountReceived = Math.ceil(totalGrossToPay * 2) / 2;

      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      const detailedError = `
FEHLER beim Erstellen der Quittung:
${errorMsg}

DEBUG INFO:
- Gast: ${selectedDeckel?.name}
- Status: ${selectedDeckel?.status}
- Anzahl Verkäufe: ${salesTransactions.length}
- Gesamtsumme (BRUTTO): ${totalGrossToPay.toFixed(2)}€
- Zahlbetrag: ${amountReceived.toFixed(2)}€

Transaktionen (Brutto-Preise):
${salesTransactions.map((tx) => `  - ${tx.description}: ${tx.sum.toFixed(2)}€`).join('\n')}
      `.trim();

      console.error(detailedError);
      setDebugMessage(detailedError);
      setDebugModalOpen(true);
    }
  };

  // Auto-Restore beim App-Start
  useEffect(() => {
    if (shouldRestoreFromBackup()) {
      setIsRestoring(true);
      setTimeout(() => {
        const success = restoreFromLocalBackup();
        if (success) {
          // Nach erfolgreichem Restore Seite neu laden
          window.location.reload();
        } else {
          setIsRestoring(false);
          alert('Fehler beim Wiederherstellen des Backups');
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    setProducts(productService.getActiveProducts());
  }, []);

  // Keyboard shortcut für Technisches Menü (Ctrl+Shift+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setIsTechMenuOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isMenuDropdownOpen) {
      setIsPdfSubmenuOpen(false);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-dropdown-container')) {
        setIsMenuDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuDropdownOpen]);

  const {
    deckelList,
    addDeckel,
    selectDeckel,
    deleteDeckel,
    addTransaction,
    updateTransaction,
    removeTransaction,
    abendAbschliessen,
    isAbendGeschlossen,
    markDeckelAsPaid,
    updateDeckelStatus,
    mergeDeckelInto,
    mergeCorrectionIntoDeckel,
    transferDeckels,
  } = useDeckelState(emergencyOverrideActive);

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

  // Reset category when changing guests
  useEffect(() => {
    setSelectedCategory(null);
  }, [selectedDeckelId]);

  const {
    isSelectedPresent,
    isReadOnly,
    hasTransactions,
    darfDeckelGezahltWerden,
    totalSum,
    darfKorrigieren,
  } = useDeckelComputed(selectedDeckel, emergencyOverrideActive ? false : isAbendGeschlossen);

  const isMobile = useIsMobile();

  const handleAdjustQuantity = (txId: string, delta: number) => {
    if (!selectedDeckel) return;

    const transaction = selectedDeckel.transactions?.find((t) => t.id === txId);
    if (!transaction) return;

    const newCount = transaction.count + delta;

    // Verhindere, dass die Anzahl auf 0 oder negativ fällt
    if (newCount <= 0) return;

    // Berechne den einzelnen Betrag pro Stück
    const unitSum = (transaction.sum ?? 0) / Math.abs(transaction.count || 1);

    // Aktualisiere die Transaktion direkt
    updateTransaction(selectedDeckel.id, txId, {
      count: newCount,
      sum: unitSum * newCount,
    });
  };

  const handleDeleteTransaction = (txId: string) => {
    if (!selectedDeckel) return;
    removeTransaction(selectedDeckel.id, txId);
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

  // --- WICHTIG: nur nicht-bezahlte Namen an das Modal übergeben
  const existingActiveNames = deckelList.filter((d) => d.status !== 'BEZAHLT').map((d) => d.name);

  // Loading Screen während Restore
  if (isRestoring) {
    return (
      <div className='flex flex-col items-center justify-center h-[100dvh] bg-gray-900 text-white'>
        <div className='text-center'>
          <div className='mb-4'>
            <div className='inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500'></div>
          </div>
          <h2 className='text-2xl font-bold mb-2'>Daten werden wiederhergestellt...</h2>
          <p className='text-gray-400'>Bitte warten Sie einen Moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-[100dvh] text-gray-200 text-white'>
      <OfflineIndicator />
      <header className='flex-shrink-0 px-4 pt-4 pb-2 border-b border-gray-300 flex justify-between items-center'>
        <h1 className='text-green-600 text-2xl font-bold select-none'>
          <span
            className='cursor-pointer'
            onClick={handleTitleTap}
            title='5x tippen für technisches Menü'
          >
            Deckelübersicht
          </span>
          {' – '}
          <span
            className='cursor-pointer hover:text-green-500 transition-colors'
            onClick={handleDateEasterEggTap}
            title=''
          >
            {new Date().toLocaleDateString()}
          </span>
        </h1>
        <div className='relative menu-dropdown-container'>
          <button
            onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
            className='text-gray-400 hover:text-white text-3xl font-bold px-3 py-1 transition'
            title='Menü'
          >
            ⋮
          </button>
          {isMenuDropdownOpen && (
            <div className='absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-700'>
              <button
                onClick={() => {
                  setIsBusinessInfoOpen(true);
                  setIsMenuDropdownOpen(false);
                }}
                className='w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition rounded-t-lg'
              >
                Betriebsinfos
              </button>
              <button
                onClick={() => {
                  setIsDeckelOverviewOpen(true);
                  setIsMenuDropdownOpen(false);
                }}
                className='w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition'
              >
                Deckelübersicht
              </button>
              <button
                onClick={() => {
                  setIsCashReportOpen(true);
                  setIsMenuDropdownOpen(false);
                }}
                className='w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition'
              >
                Kassenberichte
              </button>
              <button
                onClick={() => {
                  setIsAdminModalOpen(true);
                  setIsMenuDropdownOpen(false);
                }}
                className='w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition'
              >
                Produktverwaltung
              </button>
              <div>
                <button
                  onClick={() => setIsPdfSubmenuOpen(!isPdfSubmenuOpen)}
                  className={`w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition flex items-center justify-between ${!isPdfSubmenuOpen ? 'rounded-b-lg' : ''}`}
                >
                  <span>PDF-Export</span>
                  <span
                    className='text-gray-400 transform transition-transform'
                    style={{ transform: isPdfSubmenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  >
                    ›
                  </span>
                </button>
                {isPdfSubmenuOpen && (
                  <div className='bg-gray-900 border-t border-gray-700'>
                    <button
                      onClick={() => {
                        setIsMonthlyReportOpen(true);
                        setIsMenuDropdownOpen(false);
                        setIsPdfSubmenuOpen(false);
                      }}
                      className='w-full text-left px-6 py-3 text-white hover:bg-gray-700 transition flex items-center gap-2'
                    >
                      <span className='text-base'>Monatsabschluss</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsBelegSelectOpen(true);
                        setIsMenuDropdownOpen(false);
                        setIsPdfSubmenuOpen(false);
                      }}
                      className='w-full text-left px-6 py-3 text-white hover:bg-gray-700 rounded-b-lg transition flex items-center gap-2'
                    >
                      <span className='text-base'>Quittung</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Emergency Override Warning Banner */}
      {emergencyOverrideActive && (
        <div className='bg-yellow-600 text-black px-4 py-2 text-center font-bold flex items-center justify-center gap-2'>
          <span>⚠️</span>
          <span>NOTFALL-MODUS AKTIV - Alle Sicherheitssperren deaktiviert</span>
          <span>⚠️</span>
        </div>
      )}

      <div className='flex flex-1 flex-col lg:flex-row gap-0 overflow-hidden'>
        <GuestList
          deckelList={deckelList}
          selectedDeckelId={selectedDeckelId}
          onSelect={handleDeckelClick}
          deckelBackground={businessInfo.backgroundPath || '/assets/Deckelhintergrund.png'}
          paidDeckelBackground='/assets/bezahlt-deckckel.png'
          onStatusChange={handleStatusChange}
          onDeleteDeckel={openDeleteConfirm}
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
                onAdjustQuantity={handleAdjustQuantity}
                onDeleteTransaction={handleDeleteTransaction}
                isReadOnly={isReadOnly}
              />

              {!selectedCategory ? (
                <CategorySelector onSelectCategory={(category) => setSelectedCategory(category)} />
              ) : (
                <ProductGrid
                  products={products.filter((p) => p.category === selectedCategory)}
                  category={selectedCategory}
                  onBack={() => setSelectedCategory(null)}
                  onAddProduct={(product, count) => {
                    if (!isReadOnly && !isAddingProductTransaction) {
                      setIsAddingProductTransaction(true);
                      try {
                        addTransaction(selectedDeckel.id, {
                          date: new Date(),
                          description: product.name,
                          count,
                          sum: -(count * product.price),
                        });
                      } finally {
                        setTimeout(() => setIsAddingProductTransaction(false), 300);
                      }
                    }
                  }}
                />
              )}
            </>
          ) : deckelList.length > 0 ? (
            <DailySalesOverview deckelList={deckelList} />
          ) : null}
        </div>
      </div>

      <DeckelFooter
        isAbendGeschlossen={emergencyOverrideActive ? false : isAbendGeschlossen}
        isSelectedPresent={isSelectedPresent}
        selectedDeckel={selectedDeckel}
        isReadOnly={isReadOnly}
        hasTransactions={hasTransactions}
        darfDeckelGezahltWerden={darfDeckelGezahltWerden}
        darfKorrigieren={darfKorrigieren}
        hasMultipleDeckel={deckelList.length >= 1}
        onAddGuest={() => setModals((m) => ({ ...m, addGuest: true }))}
        onDeleteGuest={openDeleteConfirm}
        onOpenCashier={() => setCassierModalOpen(true)}
        onOpenCorrection={() => setModals((m) => ({ ...m, correction: true }))}
        onAbendAbschliessen={openAbendConfirm}
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
                  // Berechne finale Anzeigeform für Confirm (alle Deckel berücksichtigen)
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
        onGoBack={() => {
          setModals((m) => ({ ...m, pay: false }));
          setCassierModalOpen(true);
        }}
        totalSum={totalSum}
        onConfirm={handlePayConfirm}
        deckelList={deckelList}
        selectedDeckelId={selectedDeckelId}
      />

      <TransactionModal
        isOpen={modals.transaction}
        onClose={() => setModals((m) => ({ ...m, transaction: false }))}
        onGoBack={() => {
          setModals((m) => ({ ...m, transaction: false }));
          setCassierModalOpen(true);
        }}
        presets={[5, 10, 20, 50]}
        onConfirm={handleTransactionConfirm}
        deckelList={deckelList}
        selectedDeckelId={selectedDeckelId}
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

      <CashierModal
        isOpen={cassierModalOpen}
        onClose={() => setCassierModalOpen(false)}
        onSelectEinzahlung={() => setModals((m) => ({ ...m, transaction: true }))}
        onSelectZahlen={() => setModals((m) => ({ ...m, pay: true }))}
        onSelectUebertrag={() => {
          setCassierModalOpen(false);
          setTransferModalOpen(true);
        }}
      />

      <DeckeltransferModal
        isOpen={transferModalOpen}
        deckelList={deckelList}
        selectedDeckelId={selectedDeckelId}
        onClose={() => setTransferModalOpen(false)}
        onGoBack={() => {
          setTransferModalOpen(false);
          setCassierModalOpen(true);
        }}
        onConfirm={(sourceId, targetId, onlyNegative = false) => {
          const result = transferDeckels(sourceId, targetId, onlyNegative);
          if (result.success) {
            console.log('Transfer successful', result);
            setSelectedDeckelId(targetId);
          } else {
            console.warn('Transfer failed:', result.message);
          }
        }}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setProducts(productService.getActiveProducts());
        }}
      />

      <BusinessInfoModal
        isOpen={isBusinessInfoOpen}
        onClose={() => {
          setIsBusinessInfoOpen(false);
          // Reload businessInfo nach Speichern
          setBusinessInfo(loadBusinessInfo());
        }}
      />

      <CashReportModal isOpen={isCashReportOpen} onClose={() => setIsCashReportOpen(false)} />

      <DeckelOverviewModal
        isOpen={isDeckelOverviewOpen}
        onClose={() => setIsDeckelOverviewOpen(false)}
        deckelList={deckelList}
      />

      <EmergencyOverrideModal
        isOpen={isEmergencyOverrideOpen}
        onClose={() => setIsEmergencyOverrideOpen(false)}
        onConfirm={() => setEmergencyOverrideActive(!emergencyOverrideActive)}
        currentState={emergencyOverrideActive}
      />

      {/* Technisches Menü (Ctrl+Shift+B) */}
      {isTechMenuOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 rounded-lg shadow-2xl w-96 border border-gray-700'>
            <div className='px-6 py-4 border-b border-gray-700 flex justify-between items-center'>
              <h2 className='text-xl font-bold text-white'>🔧 Technisches Menü</h2>
              <button
                onClick={() => setIsTechMenuOpen(false)}
                className='text-gray-400 hover:text-white text-2xl font-bold'
              >
                ×
              </button>
            </div>
            <div className='p-2'>
              <button
                onClick={() => {
                  exportBackup();
                  setIsTechMenuOpen(false);
                }}
                className='w-full text-left px-4 py-3 text-white hover:bg-gray-700 rounded transition flex items-center gap-3'
              >
                <span className='text-2xl'>💾</span>
                <div>
                  <div className='font-semibold'>Backup erstellen</div>
                  <div className='text-sm text-gray-400'>Daten manuell exportieren</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsBackupImportOpen(true);
                  setIsTechMenuOpen(false);
                }}
                className='w-full text-left px-4 py-3 text-white hover:bg-gray-700 rounded transition flex items-center gap-3'
              >
                <span className='text-2xl'>📁</span>
                <div>
                  <div className='font-semibold'>Backup importieren</div>
                  <div className='text-sm text-gray-400'>Daten wiederherstellen</div>
                </div>
              </button>
              <button
                onClick={() => {
                  testReceiptGeneration();
                  setIsTechMenuOpen(false);
                }}
                className='w-full text-left px-4 py-3 text-white hover:bg-gray-700 rounded transition flex items-center gap-3'
              >
                <span className='text-2xl'>🧾</span>
                <div>
                  <div className='font-semibold'>Quittung erstellen</div>
                  <div className='text-sm text-gray-400'>Nach Zahlung Gastbeleg generieren</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsEmergencyOverrideOpen(true);
                  setIsTechMenuOpen(false);
                }}
                className='w-full text-left px-4 py-3 text-white hover:bg-gray-700 rounded transition flex items-center gap-3'
              >
                <span className='text-2xl'>⚠️</span>
                <div>
                  <div className='font-semibold flex items-center gap-2'>
                    Notfall-Modus
                    {emergencyOverrideActive && (
                      <span className='text-xs bg-yellow-600 px-2 py-1 rounded'>AKTIV</span>
                    )}
                  </div>
                  <div className='text-sm text-gray-400'>Sicherheitssperren umgehen</div>
                </div>
              </button>
            </div>
            <div className='px-6 py-3 bg-gray-900 rounded-b-lg border-t border-gray-700'>
              <p className='text-xs text-gray-500 text-center'>
                <span className='font-mono text-gray-400'>Ctrl + Shift + B</span> oder{' '}
                <span className='text-gray-400'>5x auf Titel tippen</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <BackupImportModal isOpen={isBackupImportOpen} onClose={() => setIsBackupImportOpen(false)} />

      <MonthlyReportModal
        isOpen={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
      />

      <BelegSelectModal
        isOpen={isBelegSelectOpen}
        onClose={() => setIsBelegSelectOpen(false)}
        deckelList={deckelList}
        products={products}
      />

      {/* Easter Egg: Game Menu & Games */}
      <GameMenu
        isOpen={isGameMenuOpen}
        onClose={() => setIsGameMenuOpen(false)}
        onSelectBeerClicker={() => setIsBeerGameOpen(true)}
        onSelect2048={() => setIs2048Open(true)}
        onSelectDeutschlandQuiz={() => setIsDeutschlandQuizOpen(true)}
      />
      <BeerClickerGame isOpen={isBeerGameOpen} onClose={() => setIsBeerGameOpen(false)} />
      <Game2048 isOpen={is2048Open} onClose={() => setIs2048Open(false)} />
      <DeutschlandQuiz
        isOpen={isDeutschlandQuizOpen}
        onClose={() => setIsDeutschlandQuizOpen(false)}
      />

      {/* Test Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptTestOpen}
        receipt={testReceipt}
        onClose={() => setIsReceiptTestOpen(false)}
      />

      {/* Debug Modal - Kopierbare Error/Info Meldungen */}
      {debugModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-auto border border-gray-600'>
            <h2 className='text-xl font-bold text-white mb-4'>Debug Information</h2>
            <textarea
              readOnly
              value={debugMessage}
              className='w-full h-48 bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm border border-gray-600 focus:outline-none'
            />
            <div className='flex gap-3 mt-4'>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(debugMessage);
                  alert('In die Zwischenablage kopiert!');
                }}
                className='flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition'
              >
                📋 Kopieren
              </button>
              <button
                onClick={() => setDebugModalOpen(false)}
                className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition'
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
