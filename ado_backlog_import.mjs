import process from 'node:process';

const organization = 'ichirmpos'; // adjust
const project = 'Kassensystem'; // adjust
const pat = process.env.AZDO_PAT || ''; // set env AZDO_PAT
const processModel = 'Scrum'; // "Scrum" or "Agile"
const batchDelayMs = 200;

const defaultAreaPath = '';
const defaultIterationPath = '';
const overrideAreaPath = process.env.AZDO_AREA_PATH || '';
const overrideIterationPath = process.env.AZDO_ITERATION_PATH || '';

const statusEvidenceField = ''; // e.g. "Custom.StatusEvidence"

const auth = Buffer.from(':' + pat).toString('base64');

function mapType(type) {
  if (processModel === 'Scrum' && type === 'User Story') {
    return 'Product Backlog Item';
  }
  return type;
}

const EPIC_KEY_TO_TITLE = new Map([
  ['EPIC-001', 'Deckel-Verwaltung'],
  ['EPIC-002', 'Zahlungsabwicklung und Trinkgeld'],
  ['EPIC-003', 'Belege und PDF Export'],
  ['EPIC-004', 'Reporting und Kassenabschluss'],
  ['EPIC-005', 'Produktkatalog und Admin'],
  ['EPIC-006', 'Backup, Offline und PWA'],
  ['EPIC-007', 'Business Infos und Branding'],
  ['EPIC-008', 'Spiele und Easter Eggs'],
  ['EPIC-009', 'Sicherheit und Notfall'],
  ['EPIC-010', 'Bestandsverwaltung und Lager'],
  ['EPIC-011', 'Technische Einstellungen und Debug'],
]);

const BACKLOG_ITEMS = [
  {
    title: 'Deckel-Verwaltung',
    description:
      'Kernfunktionen fuer Deckel, Gaeste und Transaktionen.<br/>Beleg: file:src/domain/deckelService.ts, file:src/app/DeckelScreen.tsx',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/deckelService.ts',
  },
  {
    title: 'Zahlungsabwicklung und Trinkgeld',
    description:
      'Barzahlung inkl. Rueckgeld, Trinkgeld und Abschluss von Deckeln.<br/>Beleg: file:src/app/PayDeckelModal.tsx',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/PayDeckelModal.tsx',
  },
  {
    title: 'Belege und PDF Export',
    description:
      'Quittungserstellung, Validierung, Hash und PDF Export.<br/>Beleg: file:src/domain/receiptGenerator.ts, file:src/domain/pdfExportService.ts',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/receiptGenerator.ts',
  },
  {
    title: 'Reporting und Kassenabschluss',
    description:
      'Tagesumsatz, Kassenberichte und Monatsauswertung.<br/>Beleg: file:src/app/components/DailySalesOverview.tsx, file:src/domain/cashReportService.ts',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/cashReportService.ts',
  },
  {
    title: 'Produktkatalog und Admin',
    description:
      'Produktdaten, Kategorien und Admin Pflege.<br/>Beleg: file:src/domain/productService.ts, file:src/app/AdminModal.tsx',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/productService.ts',
  },
  {
    title: 'Backup, Offline und PWA',
    description:
      'Backup Export/Import, Auto Restore und Offline Betrieb.<br/>Beleg: file:src/utils/backupService.ts, file:PWA-INSTALLATION.md',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/utils/backupService.ts',
  },
  {
    title: 'Business Infos und Branding',
    description:
      'Betriebsdaten fuer Belege und UI Branding.<br/>Beleg: file:src/domain/businessInfoService.ts',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/businessInfoService.ts',
  },
  {
    title: 'Spiele und Easter Eggs',
    description:
      'Versteckte Spiele und Game Menu.<br/>Beleg: file:src/app/GameMenu.tsx, file:EASTER-EGG-GAMES.md',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:EASTER-EGG-GAMES.md',
  },
  {
    title: 'Sicherheit und Notfall',
    description:
      'Notfallmodus und Abschluss-Logik.<br/>Beleg: file:src/app/EmergencyOverrideModal.tsx, file:src/utils/closeEvening.ts',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/utils/closeEvening.ts',
  },
  {
    title: 'Bestandsverwaltung und Lager',
    description:
      'Bestandsservice, Uebersicht, Import und Historie.<br/>Beleg: file:src/domain/stockService.ts, file:src/app/StockOverviewModal.tsx, file:src/app/StockImportModal.tsx',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/stockService.ts',
  },
  {
    title: 'Technische Einstellungen und Debug',
    description:
      'Technisches Menue, Backup-Pfade und Debug-Infos.<br/>Beleg: file:src/app/TechnicalSettingsModal.tsx, file:src/domain/technicalSettingsService.ts',
    type: 'Epic',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/TechnicalSettingsModal.tsx',
  },
  {
    title: 'Bestandsservice und Datenmodelle',
    description:
      'Service fuer Bestandsverwaltung, Historie und Filterlogik.<br/>Beleg: file:src/domain/stockService.ts, file:src/domain/stockModels.ts',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-010',
    statusEvidence: 'file:src/domain/stockService.ts',
  },
  {
    title: 'Bestandsuebersicht mit Filter und Inline-Edit',
    description:
      'Tabellarische Bestandsuebersicht mit Filtern, Sortierung und Inline-Edit.<br/>Beleg: file:src/app/StockOverviewModal.tsx',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-010',
    statusEvidence: 'file:src/app/StockOverviewModal.tsx',
  },
  {
    title: 'Bestandsimport und Matching',
    description:
      'Import von Bestandsdaten inkl. Matching und optionaler Neuerstellung.<br/>Beleg: file:src/app/StockImportModal.tsx',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-010',
    statusEvidence: 'file:src/app/StockImportModal.tsx',
  },
  {
    title: 'Bestandshistorie anzeigen und exportieren',
    description:
      'Historie fuer Bestandsaenderungen inkl. CSV Export.<br/>Beleg: file:src/app/StockHistoryModal.tsx, file:src/domain/stockService.ts',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-010',
    statusEvidence: 'file:src/app/StockHistoryModal.tsx',
  },
  {
    title: 'Live-Bestand Tracking im Verkauf',
    description:
      'Bestand wird bei Verkauf automatisch reduziert und kann im Menue aktiviert werden.<br/>Beleg: file:src/domain/stockSettingsService.ts, file:src/app/DeckelScreen.tsx',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-010',
    statusEvidence: 'file:src/domain/stockSettingsService.ts',
  },
  {
    title: 'Mengenbuttons nach Bestand limitieren',
    description:
      'Nur Mengenbuttons <= Bestand sind aktiv, hoehere Werte sind deaktiviert.<br/>Beleg: file:src/app/components/ProductGrid.tsx',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-010',
    statusEvidence: 'file:src/app/components/ProductGrid.tsx',
  },
  {
    title: 'Technisches Menue fuer Service-Funktionen',
    description:
      'Technisches Menue mit Backup, Import und Notfallfunktionen.<br/>Beleg: file:src/app/DeckelScreen.tsx',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-011',
    statusEvidence: 'file:src/app/DeckelScreen.tsx',
  },
  {
    title: 'Technische Einstellungen und Backup-Pfade',
    description:
      'Pflege von Backup-Pfaden pro Plattform inkl. Debug-Infos.<br/>Beleg: file:src/app/TechnicalSettingsModal.tsx, file:src/domain/technicalSettingsService.ts',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-011',
    statusEvidence: 'file:src/app/TechnicalSettingsModal.tsx',
  },
  {
    title: 'Sales Statistiken Dashboard',
    description:
      'Statistikansicht mit Produkten und Zeitreihen.<br/>Beleg: file:src/app/SalesStatsModal.tsx, file:src/services/salesStatsService.ts',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: 'EPIC-004',
    statusEvidence: 'file:src/app/SalesStatsModal.tsx',
  },
  {
    title: 'Gastliste mit Status und Drag-and-Drop',
    description:
      'Gaesteliste mit Spalten nach Status und Drag and Drop Umsortierung.<br/>Beleg: file:src/app/components/GuestList.tsx<br/>AK: Deckel werden in OFFEN, BEZAHLT, GONE angezeigt und sind per Drag verschiebbar.',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/components/GuestList.tsx',
  },
  {
    title: 'Gaeste pinnen und loeschen',
    description:
      'Pinning im Dropdown und Loeschfunktion fuer Deckel.<br/>Beleg: file:src/app/components/GuestList.tsx<br/>AK: Pin markiert Deckel mit Icon, Loeschen entfernt Deckel aus Liste.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/components/GuestList.tsx',
  },
  {
    title: 'Deckel auswaehlen und Status wechseln',
    description:
      'Auswahl eines Deckels und Statusaenderung im UI Flow.<br/>Beleg: file:src/app/hooks/useDeckelUIState.ts<br/>AK: Ausgewaehlter Deckel ist aktiv und Statusaenderung wird gespeichert.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/hooks/useDeckelUIState.ts',
  },
  {
    title: 'Transaktionen und Korrekturen',
    description:
      'Verkaufstransaktionen, Korrekturfluss und Merge in andere Deckel.<br/>Beleg: file:src/app/hooks/useDeckelUIState.ts',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/hooks/useDeckelUIState.ts',
  },
  {
    title: 'Transaktionstabelle mit Menge und Loeschen',
    description:
      'Tabelle zeigt Transaktionen, Mengenaenderung und Loeschen von Produkten.<br/>Beleg: file:src/app/components/DeckelTable.tsx<br/>AK: Plus/Minus passen count an, Loeschen entfernt Verkauf wenn nicht read only.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/components/DeckelTable.tsx',
  },
  {
    title: 'Deckel merge und Korrektur flow',
    description:
      'Korrektur kann in anderen Deckel gemerged oder als GONE markiert werden.<br/>Beleg: file:src/app/hooks/useDeckelUIState.ts<br/>AK: Merge verschiebt Transaktionen und setzt Status korrekt.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/hooks/useDeckelUIState.ts',
  },
  {
    title: 'Deckel Lifecycle und Storage',
    description:
      'LocalStorage Persistenz, Session Cleanup und 05:00 Regel fuer bezahlte Deckel.<br/>Beleg: file:src/domain/deckelService.ts<br/>AK: Bezahlt-Deckel werden bei neuem Browserstart entfernt.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/deckelService.ts',
  },
  {
    title: 'Barzahlung mit Rueckgeld und Trinkgeld',
    description:
      'Zahlungsdialog mit Rueckgeldauszahlung und Trinkgeldannahme.<br/>Beleg: file:src/app/PayDeckelModal.tsx<br/>AK: Rueckgeld und Trinkgeld koennen getrennt erfasst werden.',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/PayDeckelModal.tsx',
  },
  {
    title: 'Tip und Rueckgeld als Transaktionen',
    description:
      'Trinkgeld wird als eigene Transaktion markiert und Rueckgeld erfasst.<br/>Beleg: file:src/app/hooks/useDeckelUIState.ts, file:src/domain/models.ts<br/>AK: isTip kennzeichnet Trinkgeld und wird in Auswertungen gefiltert.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/hooks/useDeckelUIState.ts',
  },
  {
    title: 'Quittungserstellung und Steuersplit',
    description:
      'Erzeugt Line Items aus Transaktionen und berechnet Steuerzusammenfassung.<br/>Beleg: file:src/domain/receiptGenerator.ts<br/>AK: Line Items werden aus Verkaeufen berechnet, Rueckgeld/Tip ausgeschlossen.',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/receiptGenerator.ts',
  },
  {
    title: 'Quittungsvalidierung',
    description:
      'Validierung der Summen, Steuersaetze und Zahlungslogik.<br/>Beleg: file:src/domain/receiptValidation.ts<br/>AK: Ungueltige Quittungen werden mit Fehlern abgewiesen.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented,tested',
    parent: '',
    statusEvidence: 'tests:src/domain/receiptModule.test.ts',
  },
  {
    title: 'Hash Generierung und Verifikation',
    description:
      'SHA-256 Hash fuer Quittungen und Verifikation gegen Manipulation.<br/>Beleg: file:src/domain/receiptHash.ts<br/>AK: Hash bleibt stabil bei identischen Belegen.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented,tested',
    parent: '',
    statusEvidence: 'tests:src/domain/receiptModule.test.ts',
  },
  {
    title: 'PDF Export fuer Gastbeleg',
    description:
      'PDF Export mit Artikeln, Steuer und Zahlungsdetails.<br/>Beleg: file:src/domain/pdfExportService.ts<br/>AK: PDF enthaelt Artikel, Summen, Rueckgeld und Trinkgeld falls vorhanden.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 1,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/pdfExportService.ts',
  },
  {
    title: 'Beleg Auswahl fuer bezahlte Deckel',
    description:
      'Auswahl bezahlter Deckel und Erzeugung des PDFs.<br/>Beleg: file:src/app/BelegSelectModal.tsx<br/>AK: Nur BEZAHLT Deckel sind auswaehlbar.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/BelegSelectModal.tsx',
  },
  {
    title: 'Beleg teilen ueber Share API',
    description:
      'Share API Nutzung fuer PDF Teilen falls verfuegbar.<br/>Beleg: file:src/app/BelegSelectModal.tsx<br/>AK: Fehlerhinweis wenn share nicht verfuegbar.',
    type: 'Task',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/BelegSelectModal.tsx',
  },
  {
    title: 'Tagesumsatz Uebersicht',
    description:
      'Aggregiert Produktverkaeufe bezahlter Deckel.<br/>Beleg: file:src/app/components/DailySalesOverview.tsx<br/>AK: Tabelle zeigt Produkt, Menge und Umsatz.',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/components/DailySalesOverview.tsx',
  },
  {
    title: 'Kassenberichte speichern und filtern',
    description:
      'Speichern von Tagesumsatz und Filtern nach Monat und Jahr.<br/>Beleg: file:src/domain/cashReportService.ts<br/>AK: getReportsByMonth liefert Eintraege je Monat.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/cashReportService.ts',
  },
  {
    title: 'Produktservice und Defaults',
    description:
      'Produktkatalog mit Defaults, CRUD und Soft Delete.<br/>Beleg: file:src/domain/productService.ts<br/>AK: Produkte werden in localStorage gespeichert.',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/productService.ts',
  },
  {
    title: 'Admin Pflege von Produkten',
    description:
      'Admin UI fuer Produktbearbeitung inkl. Kategorie und Preis.<br/>Beleg: file:src/app/AdminModal.tsx<br/>AK: Produkte koennen hinzugefuegt und bearbeitet werden.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/AdminModal.tsx',
  },
  {
    title: 'Kategorieauswahl',
    description:
      'Kategorieauswahl fuer Produkte im Verkauf.<br/>Beleg: file:src/app/components/CategorySelector.tsx<br/>AK: Klick auf Kategorie zeigt Produktgrid.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/components/CategorySelector.tsx',
  },
  {
    title: 'Produktgrid mit Strichlisten',
    description:
      'Produktgrid mit Mengenbuttons und Icons.<br/>Beleg: file:src/app/components/ProductGrid.tsx<br/>AK: Klick auf Menge fuegt Transaktion hinzu.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/components/ProductGrid.tsx',
  },
  {
    title: 'Backup Export und Import',
    description:
      'JSON Backup Export und Import mit Bestaetigung.<br/>Beleg: file:src/utils/backupService.ts<br/>AK: Export erzeugt Datei, Import schreibt localStorage.',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/utils/backupService.ts',
  },
  {
    title: 'Auto Backup und Restore',
    description:
      'Auto Backup in localStorage und Restore bei fehlenden Daten.<br/>Beleg: file:src/utils/backupService.ts, file:src/app/DeckelScreen.tsx<br/>AK: Restore wird beim Start angeboten wenn Daten fehlen.',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/utils/backupService.ts',
  },
  {
    title: 'Offline Indicator',
    description:
      'Anzeige fuer Offline Modus.<br/>Beleg: file:src/assets/components/OfflineIndicator.tsx',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/assets/components/OfflineIndicator.tsx',
  },
  {
    title: 'PWA Installation und Offline Doku',
    description:
      'Dokumentation fuer Installation und Offline Betrieb.<br/>Beleg: file:PWA-INSTALLATION.md',
    type: 'Task',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 4,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:PWA-INSTALLATION.md',
  },
  {
    title: 'Business Info Service',
    description:
      'Laden und Speichern von Betriebsdaten aus localStorage.<br/>Beleg: file:src/domain/businessInfoService.ts<br/>AK: Defaults werden geladen wenn kein Eintrag existiert.',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/domain/businessInfoService.ts',
  },
  {
    title: 'Business Info Modal',
    description:
      'UI fuer Bearbeitung von Betriebsdaten.<br/>Beleg: file:src/app/BusinessInfoModal.tsx',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 3,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/BusinessInfoModal.tsx',
  },
  {
    title: 'Game Menu und Easter Egg Trigger',
    description:
      'Game Menu oeffnet nach 8x Tap auf Datum.<br/>Beleg: file:src/app/DeckelScreen.tsx, file:EASTER-EGG-GAMES.md',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 4,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/DeckelScreen.tsx',
  },
  {
    title: 'Beer Clicker Game',
    description:
      'Minigame fuer Schnellzapfen mit Highscore.<br/>Beleg: file:src/app/BeerClickerGame.tsx',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 4,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/BeerClickerGame.tsx',
  },
  {
    title: '2048 Game',
    description: '2048 Spiel als Easter Egg.<br/>Beleg: file:src/app/Game2048.tsx',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 4,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/Game2048.tsx',
  },
  {
    title: 'Deutschland Quiz',
    description:
      'Quizspiel mit Fragenkatalog.<br/>Beleg: file:src/app/DeutschlandQuiz.tsx, file:src/app/quiz/deutschlandQuestions.ts',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 4,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/DeutschlandQuiz.tsx',
  },
  {
    title: 'Notfallmodus',
    description:
      'Notfallmodus deaktiviert Sperren und zeigt Warnung.<br/>Beleg: file:src/app/EmergencyOverrideModal.tsx, file:src/app/DeckelScreen.tsx',
    type: 'Feature',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/app/EmergencyOverrideModal.tsx',
  },
  {
    title: 'Abend abschliessen Logik',
    description:
      'Berechnet Statusaenderungen und Zeitfenster fuer Abschluss.<br/>Beleg: file:src/utils/closeEvening.ts, file:src/domain/deckelService.ts',
    type: 'User Story',
    areaPath: 'Client-PWA',
    iterationPath: 'Iteration 1',
    priority: 2,
    storyPoints: '',
    tags: 'implemented',
    parent: '',
    statusEvidence: 'file:src/utils/closeEvening.ts',
  },
];

async function createWorkItem(item, areaPath, iterationPath, parentId = null) {
  const mappedType = mapType(item.type);
  const encodedType = encodeURIComponent(mappedType);
  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$${encodedType}?api-version=7.1-preview.3`;

  const description = buildDescription(item);
  const body = [
    { op: 'add', path: '/fields/System.Title', value: item.title },
    { op: 'add', path: '/fields/System.Description', value: description },
    { op: 'add', path: '/fields/System.AreaPath', value: areaPath || item.areaPath },
    {
      op: 'add',
      path: '/fields/System.IterationPath',
      value: iterationPath || item.iterationPath,
    },
    { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: item.priority },
  ];

  if (item.tags) {
    body.push({ op: 'add', path: '/fields/System.Tags', value: item.tags });
  }

  if (item.storyPoints) {
    const points = Number(item.storyPoints);
    if (!Number.isNaN(points)) {
      body.push({
        op: 'add',
        path: '/fields/Microsoft.VSTS.Scheduling.StoryPoints',
        value: points,
      });
    }
  }

  if (statusEvidenceField && item.statusEvidence) {
    body.push({
      op: 'add',
      path: `/fields/${statusEvidenceField}`,
      value: item.statusEvidence,
    });
  }

  if (parentId) {
    body.push({
      op: 'add',
      path: '/relations/-',
      value: {
        rel: 'System.LinkTypes.Hierarchy-Reverse',
        url: `https://dev.azure.com/${organization}/_apis/wit/workItems/${parentId}`,
      },
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json-patch+json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }

  const data = await res.json();
  console.log(`Created [${mappedType}] ${data.id} - ${item.title}`);
  return data.id;
}

function buildDescription(item) {
  if (!item.statusEvidence) return item.description || '';
  if (statusEvidenceField) return item.description || '';
  const suffix = `<br/>StatusEvidence: ${item.statusEvidence}`;
  return (item.description || '') + suffix;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function groupByType(items) {
  const map = new Map();
  for (const item of items) {
    const type = item.type || '';
    if (!map.has(type)) map.set(type, []);
    map.get(type).push(item);
  }
  return map;
}

function resolveParentId(item, idByTitle, epicKeyToTitle) {
  if (!item.parent) return null;
  if (idByTitle.has(item.parent)) return idByTitle.get(item.parent);
  if (epicKeyToTitle.has(item.parent)) {
    const title = epicKeyToTitle.get(item.parent);
    if (idByTitle.has(title)) return idByTitle.get(title);
  }
  return null;
}

function normalizePath(pathValue) {
  if (!pathValue) return '';
  return pathValue.replace(/^\\+/, '');
}

function collectPaths(node, currentPath, results) {
  const nodeName = node.name || '';
  const traversalPath = currentPath ? `${currentPath}\\${nodeName}` : nodeName;
  const normalizedTraversal = normalizePath(traversalPath);
  const normalizedNodePath = normalizePath(node.path || '');

  if (normalizedTraversal) results.push(normalizedTraversal);
  if (normalizedNodePath) results.push(normalizedNodePath);

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collectPaths(child, normalizedTraversal, results);
    }
  }
}

async function fetchClassificationPaths(kind) {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/classificationnodes/${kind}?depth=5&api-version=7.1-preview.2`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }

  const data = await res.json();
  const collected = [];
  collectPaths(data, '', collected);
  const unique = [];
  const seen = new Set();
  for (const value of collected) {
    if (!seen.has(value)) {
      seen.add(value);
      unique.push(value);
    }
  }
  return unique;
}

async function resolvePath(requested, kind) {
  const paths = await fetchClassificationPaths(kind);
  const normalizedRequested = normalizePath(requested);
  if (normalizedRequested) {
    const exact = paths.find((p) => p === normalizedRequested);
    if (exact) return exact;
    const lower = normalizedRequested.toLowerCase();
    const ci = paths.find((p) => p.toLowerCase() === lower);
    if (ci) return ci;
  }

  if (paths.length > 0) {
    const fallback = paths[0];
    if (normalizedRequested) {
      console.warn(`Warning: ${kind} path "${requested}" not found. Using "${fallback}" instead.`);
    }
    return fallback;
  }

  throw new Error(`No ${kind} paths found from classification nodes.`);
}

async function run() {
  if (!pat) {
    throw new Error('AZDO_PAT is required (set env AZDO_PAT). ');
  }

  if (process.env.AZDO_PRINT_PATHS === '1') {
    const areaPaths = await fetchClassificationPaths('areas');
    const iterationPaths = await fetchClassificationPaths('iterations');
    console.log('Area Paths:');
    areaPaths.forEach((p) => console.log(`- ${p}`));
    console.log('Iteration Paths:');
    iterationPaths.forEach((p) => console.log(`- ${p}`));
    return;
  }

  const resolvedAreaPath = await resolvePath(overrideAreaPath || defaultAreaPath, 'areas');
  const resolvedIterationPath = await resolvePath(
    overrideIterationPath || defaultIterationPath,
    'iterations'
  );
  if (!resolvedAreaPath || !resolvedIterationPath) {
    throw new Error('Could not resolve valid Area/Iteration paths from ADO.');
  }

  console.log(`Using Area Path: ${resolvedAreaPath}`);
  console.log(`Using Iteration Path: ${resolvedIterationPath}`);

  const items = BACKLOG_ITEMS;
  const epicKeyToTitle = EPIC_KEY_TO_TITLE;
  const byType = groupByType(items);

  const idByTitle = new Map();

  const order = ['Epic', 'Feature', 'User Story', 'Task'];
  for (const type of order) {
    const group = byType.get(type) || [];
    for (const item of group) {
      const parentId = resolveParentId(item, idByTitle, epicKeyToTitle);
      const id = await createWorkItem(item, resolvedAreaPath, resolvedIterationPath, parentId);
      idByTitle.set(item.title, id);
      await sleep(batchDelayMs);
    }
  }

  console.log('Done');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
