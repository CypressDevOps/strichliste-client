// src/utils/pdfExportService.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DeckelUIState, Transaction, Product } from '../domain/models';

interface CashReport {
  date: string;
  revenue: number;
}

/**
 * Hilfsfunktion zum Laden eines Bildes als base64
 */
async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Generiert einen Monatsabschluss als PDF
 */
export async function generateMonthlyReportPDF(year: number, month: number): Promise<void> {
  // Lade cash_reports aus localStorage
  const reportsString = localStorage.getItem('cash_reports');
  if (!reportsString) {
    alert('Keine Kassendaten gefunden');
    return;
  }

  const allReports: CashReport[] = JSON.parse(reportsString);

  // Filtere Berichte für den gewählten Monat
  const monthReports = allReports.filter((report) => {
    const reportDate = new Date(report.date);
    return reportDate.getFullYear() === year && reportDate.getMonth() === month;
  });

  if (monthReports.length === 0) {
    alert(`Keine Daten für ${getMonthName(month)} ${year} gefunden`);
    return;
  }

  // Erstelle PDF
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Logo laden
  try {
    const logoImg = await loadImage('/images/logo.png');
    doc.addImage(logoImg, 'PNG', pageWidth - 45, 10, 35, 35);
  } catch (error) {
    console.warn('Logo konnte nicht geladen werden:', error);
  }

  // === 1. KOPFBEREICH ===
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Monatsabschluss', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${getMonthName(month)} ${year}`, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  const erstellungsDatum = new Date().toLocaleString('de-DE');
  doc.text(`Erstellt am: ${erstellungsDatum}`, pageWidth / 2, 37, { align: 'center' });

  // Reset color
  doc.setTextColor(0);

  // === 2. ZUSAMMENFASSUNG ===
  const gesamtumsatz = monthReports.reduce((sum, r) => sum + r.revenue, 0);
  const anzahlTage = monthReports.length;
  const durchschnitt = gesamtumsatz / anzahlTage;
  const hoechsterTag = monthReports.reduce((max, r) => (r.revenue > max.revenue ? r : max));
  const niedrigsterTag = monthReports.reduce((min, r) => (r.revenue < min.revenue ? r : min));

  let yPos = 50;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Zusammenfassung', 14, yPos);

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Gesamtumsatz:', formatCurrency(gesamtumsatz)],
    ['Anzahl abgeschlossener Tage:', anzahlTage.toString()],
    ['Durchschnittlicher Tagesumsatz:', formatCurrency(durchschnitt)],
    [
      'Höchster Tagesumsatz:',
      `${formatCurrency(hoechsterTag.revenue)} (${formatDate(hoechsterTag.date)})`,
    ],
    [
      'Niedrigster Tagesumsatz:',
      `${formatCurrency(niedrigsterTag.revenue)} (${formatDate(niedrigsterTag.date)})`,
    ],
  ];

  summaryData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 100, yPos);
    yPos += 7;
  });

  // === 3. TAGESÜBERSICHT ===
  yPos += 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Tagesübersicht', 14, yPos);

  yPos += 5;

  // Sortiere nach Datum
  const sortedReports = [...monthReports].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const tableData = sortedReports.map((report) => [
    formatDate(report.date),
    formatCurrency(report.revenue),
    formatCurrency(report.revenue / 1.19), // Netto (vereinfacht: 19% MwSt)
    '-', // Anzahl Gäste (nicht verfügbar)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Datum', 'Brutto', 'Netto (geschätzt)', 'Gäste']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94], // Green
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'center' },
    },
  });

  // === 4. STEUERÜBERSICHT (vereinfacht) ===
  const lastTable = doc.lastAutoTable as { finalY: number } | undefined;
  yPos = (lastTable?.finalY ?? yPos) + 15;

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Steuerübersicht', 14, yPos);

  yPos += 5;

  const netto = gesamtumsatz / 1.19;
  const steuer = gesamtumsatz - netto;

  autoTable(doc, {
    startY: yPos,
    head: [['Beschreibung', 'Betrag']],
    body: [
      ['Nettoumsatz (19% MwSt)', formatCurrency(netto)],
      ['Umsatzsteuer (19%)', formatCurrency(steuer)],
      ['Bruttoumsatz', formatCurrency(gesamtumsatz)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // === FUSSBEREICH ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Seite ${i} von ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Deckel PWA - Kassensystem', 14, pageHeight - 10);
  }

  // Speichern
  const filename = `Monatsabschluss_${year}-${String(month + 1).padStart(2, '0')}.pdf`;
  doc.save(filename);
}

function getMonthName(month: number): string {
  const months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];
  return months[month];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Generiert einen Beleg für ausgewählte Deckel als PDF
 */
export async function generateBelegPDF(deckels: DeckelUIState[]): Promise<void> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Logo laden
  try {
    const logoImg = await loadImage('/images/logo.png');
    doc.addImage(logoImg, 'PNG', pageWidth - 45, 10, 35, 35);
  } catch (error) {
    console.warn('Logo konnte nicht geladen werden:', error);
  }

  // === 1. KOPFBEREICH ===
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Beleg', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Deckel PWA Kassensystem', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  const erstellungsDatum = new Date().toLocaleString('de-DE');
  doc.text(`Erstellt am: ${erstellungsDatum}`, pageWidth / 2, 35, { align: 'center' });

  // Belegnummer
  const belegnummer = `BEL-${Date.now()}`;
  doc.text(`Belegnummer: ${belegnummer}`, pageWidth / 2, 42, { align: 'center' });

  doc.setTextColor(0);

  let yPos = 55;

  // === 2. GAST- / DECKELÜBERSICHT ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ausgewählte Deckel:', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  deckels.forEach((deckel) => {
    doc.text(`• ${deckel.name}`, 14, yPos);
    yPos += 5;
  });

  yPos += 5;

  // === 3. POSITIONSTABELLE ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Positionen:', 14, yPos);
  yPos += 5;

  // Sammle alle Transaktionen
  const allTransactions: Array<Transaction & { deckelName: string }> = [];
  deckels.forEach((deckel) => {
    (deckel.transactions ?? []).forEach((tx) => {
      allTransactions.push({
        ...tx,
        deckelName: deckel.name,
      });
    });
  });

  // Gruppiere nach Artikeln
  const artikelMap = new Map<
    string,
    {
      count: number;
      einzelpreis: number;
      gesamt: number;
    }
  >();

  allTransactions.forEach((tx) => {
    if (tx.sum < 0) {
      // Negativer Betrag = Ausgabe (Produkt)
      const key = tx.description;
      const existing = artikelMap.get(key);
      const txCount = Math.abs(tx.count || 1);
      const txEinzelpreis = Math.abs(tx.sum) / txCount;

      if (existing) {
        existing.count += txCount;
        existing.gesamt += Math.abs(tx.sum);
      } else {
        artikelMap.set(key, {
          count: txCount,
          einzelpreis: txEinzelpreis,
          gesamt: Math.abs(tx.sum),
        });
      }
    }
  });

  // Erstelle Tabellendaten
  const tableData: (string | number)[][] = [];
  let summeAusgaben = 0;

  artikelMap.forEach((value, key) => {
    tableData.push([
      value.count.toString(),
      key,
      formatCurrency(value.einzelpreis),
      formatCurrency(value.gesamt),
    ]);
    summeAusgaben += value.gesamt;
  });

  // Zahlungen (positive Beträge)
  const zahlungen = allTransactions.filter((tx) => tx.sum > 0);
  let summeZahlungen = 0;
  zahlungen.forEach((tx) => {
    summeZahlungen += tx.sum;
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Menge', 'Artikel', 'Einzelpreis', 'Gesamtpreis']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  // === 4. ZWISCHENSUMMEN ===
  const lastTable = doc.lastAutoTable as { finalY: number } | undefined;
  yPos = (lastTable?.finalY ?? yPos) + 15;

  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summen:', 14, yPos);
  yPos += 8;

  // Lade Produkte aus localStorage für Kategorieermittlung
  const productsString = localStorage.getItem('products');
  const products = productsString ? JSON.parse(productsString) : [];

  // Kategorisiere Artikel nach Steuersatz
  let summe7Prozent = 0;
  let summe19Prozent = 0;

  artikelMap.forEach((value, key) => {
    // Suche Produkt nach Namen
    const product = products.find((p: Product) => p.name === key);

    if (product && product.category === 'Snacks') {
      // 7% MwSt für Snacks
      summe7Prozent += value.gesamt;
    } else {
      // 19% MwSt für alles andere
      summe19Prozent += value.gesamt;
    }
  });

  // Berechne Netto und Steuer für beide Steuersätze
  const netto7 = summe7Prozent / 1.07;
  const steuer7 = summe7Prozent - netto7;
  const netto19 = summe19Prozent / 1.19;
  const steuer19 = summe19Prozent - netto19;

  const summenData: (string | number)[][] = [];

  // Nur anzeigen, wenn es Artikel mit diesem Steuersatz gibt
  if (summe19Prozent > 0) {
    summenData.push(['Nettobetrag (19% MwSt)', formatCurrency(netto19)]);
    summenData.push(['Umsatzsteuer (19%)', formatCurrency(steuer19)]);
  }
  if (summe7Prozent > 0) {
    summenData.push(['Nettobetrag (7% MwSt)', formatCurrency(netto7)]);
    summenData.push(['Umsatzsteuer (7%)', formatCurrency(steuer7)]);
  }
  summenData.push(['Bruttobetrag', formatCurrency(summeAusgaben)]);

  autoTable(doc, {
    startY: yPos,
    body: summenData,
    theme: 'plain',
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'normal' },
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // === 5. ZAHLUNGEN ===
  const lastTable2 = doc.lastAutoTable as { finalY: number } | undefined;
  yPos = (lastTable2?.finalY ?? yPos) + 15;

  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Zahlungen:', 14, yPos);
  yPos += 8;

  const zahlungenData: (string | number)[][] = [];
  zahlungen.forEach((tx) => {
    zahlungenData.push([tx.description, formatCurrency(tx.sum)]);
  });

  if (zahlungenData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      body: zahlungenData,
      theme: 'plain',
      styles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', fontStyle: 'bold' },
      },
    });
  }

  const lastTable3 = doc.lastAutoTable as { finalY: number } | undefined;
  yPos = (lastTable3?.finalY ?? yPos) + 10;

  // Offener Betrag
  const offenerBetrag = summeAusgaben - summeZahlungen;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Offener Betrag: ${formatCurrency(offenerBetrag)}`, 14, yPos);

  // === 6. HINWEISE ===
  yPos += 15;
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text('Dies ist ein Beleg, keine Rechnung.', 14, yPos);

  // === 7. FUSSBEREICH ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Seite ${i} von ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
    doc.text('Deckel PWA - Kassensystem', 14, pageHeight - 10);
  }

  // Speichern
  const filename = `Beleg_${belegnummer}.pdf`;
  doc.save(filename);
}

/**
 * Generiert einen Beleg als PDF und gibt ihn als Data URL zurück (für QR-Code)
 */
export async function generateBelegPDFAsDataURL(deckels: DeckelUIState[]): Promise<string> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Logo laden
  try {
    const logoImg = await loadImage('/images/logo.png');
    doc.addImage(logoImg, 'PNG', pageWidth - 45, 10, 35, 35);
  } catch (error) {
    console.warn('Logo konnte nicht geladen werden:', error);
  }

  // === 1. KOPFBEREICH ===
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Beleg', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Deckel PWA Kassensystem', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  const erstellungsDatum = new Date().toLocaleString('de-DE');
  doc.text(`Erstellt am: ${erstellungsDatum}`, pageWidth / 2, 35, { align: 'center' });

  // Belegnummer
  const belegnummer = `BEL-${Date.now()}`;
  doc.text(`Belegnummer: ${belegnummer}`, pageWidth / 2, 42, { align: 'center' });

  doc.setTextColor(0);

  let yPos = 55;

  // === 2. GAST- / DECKELÜBERSICHT ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ausgewählte Deckel:', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  deckels.forEach((deckel) => {
    doc.text(`• ${deckel.name}`, 14, yPos);
    yPos += 5;
  });

  yPos += 5;

  // === 3. POSITIONSTABELLE ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Positionen:', 14, yPos);
  yPos += 5;

  // Sammle alle Transaktionen
  const allTransactions: Array<Transaction & { deckelName: string }> = [];
  deckels.forEach((deckel) => {
    (deckel.transactions ?? []).forEach((tx) => {
      allTransactions.push({
        ...tx,
        deckelName: deckel.name,
      });
    });
  });

  // Gruppiere nach Artikeln
  const artikelMap = new Map<
    string,
    {
      count: number;
      einzelpreis: number;
      gesamt: number;
    }
  >();

  allTransactions.forEach((tx) => {
    if (tx.sum < 0) {
      // Negativer Betrag = Ausgabe (Produkt)
      const key = tx.description;
      const existing = artikelMap.get(key);
      const txCount = Math.abs(tx.count || 1);
      const txEinzelpreis = Math.abs(tx.sum) / txCount;

      if (existing) {
        existing.count += txCount;
        existing.gesamt += Math.abs(tx.sum);
      } else {
        artikelMap.set(key, {
          count: txCount,
          einzelpreis: txEinzelpreis,
          gesamt: Math.abs(tx.sum),
        });
      }
    }
  });

  // Erstelle Tabellendaten
  const tableData: (string | number)[][] = [];
  let summeAusgaben = 0;

  artikelMap.forEach((value, key) => {
    tableData.push([
      value.count.toString(),
      key,
      formatCurrency(value.einzelpreis),
      formatCurrency(value.gesamt),
    ]);
    summeAusgaben += value.gesamt;
  });

  // Zahlungen (positive Beträge)
  const zahlungen = allTransactions.filter((tx) => tx.sum > 0);
  let summeZahlungen = 0;
  zahlungen.forEach((tx) => {
    summeZahlungen += tx.sum;
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Menge', 'Artikel', 'Einzelpreis', 'Gesamtpreis']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  // === 4. ZWISCHENSUMMEN ===
  const lastTable = doc.lastAutoTable as { finalY: number } | undefined;
  yPos = (lastTable?.finalY ?? yPos) + 15;

  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summen:', 14, yPos);
  yPos += 8;

  // Lade Produkte aus localStorage für Kategorieermittlung
  const productsString = localStorage.getItem('products');
  const products = productsString ? JSON.parse(productsString) : [];

  // Kategorisiere Artikel nach Steuersatz
  let summe7Prozent = 0;
  let summe19Prozent = 0;

  artikelMap.forEach((value, key) => {
    // Suche Produkt nach Namen
    const product = products.find((p: Product) => p.name === key);

    if (product && product.category === 'Snacks') {
      // 7% MwSt für Snacks
      summe7Prozent += value.gesamt;
    } else {
      // 19% MwSt für alles andere
      summe19Prozent += value.gesamt;
    }
  });

  // Berechne Netto und Steuer für beide Steuersätze
  const netto7 = summe7Prozent / 1.07;
  const steuer7 = summe7Prozent - netto7;
  const netto19 = summe19Prozent / 1.19;
  const steuer19 = summe19Prozent - netto19;

  const summenData: (string | number)[][] = [];

  // Nur anzeigen, wenn es Artikel mit diesem Steuersatz gibt
  if (summe19Prozent > 0) {
    summenData.push(['Nettobetrag (19% MwSt)', formatCurrency(netto19)]);
    summenData.push(['Umsatzsteuer (19%)', formatCurrency(steuer19)]);
  }
  if (summe7Prozent > 0) {
    summenData.push(['Nettobetrag (7% MwSt)', formatCurrency(netto7)]);
    summenData.push(['Umsatzsteuer (7%)', formatCurrency(steuer7)]);
  }
  summenData.push(['Bruttobetrag', formatCurrency(summeAusgaben)]);

  autoTable(doc, {
    startY: yPos,
    body: summenData,
    theme: 'plain',
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'normal' },
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // === 5. ZAHLUNGEN ===
  const lastTable2 = doc.lastAutoTable as { finalY: number } | undefined;
  yPos = (lastTable2?.finalY ?? yPos) + 15;

  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Zahlungen:', 14, yPos);
  yPos += 8;

  const zahlungenData: (string | number)[][] = [];
  zahlungen.forEach((tx) => {
    zahlungenData.push([tx.description, formatCurrency(tx.sum)]);
  });

  if (zahlungenData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      body: zahlungenData,
      theme: 'plain',
      styles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', fontStyle: 'bold' },
      },
    });
  }

  const lastTable3 = doc.lastAutoTable as { finalY: number } | undefined;
  yPos = (lastTable3?.finalY ?? yPos) + 10;

  // Offener Betrag
  const offenerBetrag = summeAusgaben - summeZahlungen;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Offener Betrag: ${formatCurrency(offenerBetrag)}`, 14, yPos);

  // === 6. HINWEISE ===
  yPos += 15;
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text('Dies ist ein Beleg, keine Rechnung.', 14, yPos);

  // === 7. FUSSBEREICH ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Seite ${i} von ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
    doc.text('Deckel PWA - Kassensystem', 14, pageHeight - 10);
  }

  // Als Data URL zurückgeben
  return doc.output('dataurlstring');
}
