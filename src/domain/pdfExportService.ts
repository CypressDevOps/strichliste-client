/**
 * PDF Export Service für Quittungen (Gastbeleg)
 * Konvertiert GastBeleg Objekte zu druckbaren PDFs mit deutscher Formatierung
 */

import jsPDF from 'jspdf';
import { GastBeleg, CashPayment, CardPayment, TransferPayment } from './models';

/**
 * Formatiert Betrag nach deutschem Standard: 1.234,56 €
 */
function formatCurrencyDE(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Type Guards für PaymentDetails
 */
function isCashPayment(details: unknown): details is CashPayment {
  return (
    details !== null &&
    typeof details === 'object' &&
    'method' in details &&
    details.method === 'CASH'
  );
}

function isCardPayment(details: unknown): details is CardPayment {
  return (
    details !== null &&
    typeof details === 'object' &&
    'method' in details &&
    details.method === 'CARD'
  );
}

function isTransferPayment(details: unknown): details is TransferPayment {
  return (
    details !== null &&
    typeof details === 'object' &&
    'method' in details &&
    details.method === 'TRANSFER'
  );
}

export interface PDFExportOptions {
  /**
   * Wenn true: Öffnet das PDF im Browser statt es zu speichern
   */
  preview?: boolean;
  /**
   * Zusätzlicher Text für Fußbereich (z.B. Vielen Dank!)
   */
  footerText?: string;
}

/**
 * Exportiert eine Quittung als PDF
 *
 * @param receipt Die GastBeleg zur Einkonvertierung
 * @param options Export-Optionen
 */
export async function exportReceiptToPDF(
  receipt: GastBeleg,
  options: PDFExportOptions = {}
): Promise<void> {
  // A4 Papierformat: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'A4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 10;
  const marginLeft = 10;
  const marginRight = 10;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // === Header: Logo & Geschäftsdaten ===

  if (receipt.business.logoPath) {
    try {
      // Versuche Logo zu laden (data URL oder relativer Pfad)
      const img = new Image();
      img.src = receipt.business.logoPath;

      // Warte auf Bildladevorgang (mit Timeout)
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 1000);
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };
      });

      // Wenn erfolgreich geladen: Füge zur PDF hinzu
      if (img.complete && img.naturalWidth > 0) {
        doc.addImage(img, 'PNG', marginLeft, yPosition, 25, 25);
        yPosition += 30;
      }
    } catch {
      // Logo-Fehler ignorieren, weitermachen ohne Logo
    }
  }

  // Geschäftsname und Adresse
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.business.businessName, marginLeft, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const addressLines = receipt.business.address.split('\n');
  for (const line of addressLines) {
    doc.text(line, marginLeft, yPosition);
    yPosition += 5;
  }

  yPosition += 3;

  // Steuernummer / UmsatzSt-ID
  if (receipt.business.taxNumber || receipt.business.vatId) {
    doc.setFontSize(8);
    const businessInfoLeft: string[] = [];
    const businessInfoRight: string[] = [];

    if (receipt.business.taxNumber) {
      businessInfoLeft.push(`Steuernummer: ${receipt.business.taxNumber}`);
    }
    if (receipt.business.vatId) {
      businessInfoLeft.push(`UmsatzSt-ID: ${receipt.business.vatId}`);
    }
    if (receipt.business.phone) {
      businessInfoRight.push(`Tel: ${receipt.business.phone}`);
    }
    if (receipt.business.email) {
      businessInfoRight.push(`Email: ${receipt.business.email}`);
    }

    const maxInfoY = yPosition;
    for (const info of businessInfoLeft) {
      doc.text(info, marginLeft, yPosition);
      yPosition += 4;
    }

    yPosition = maxInfoY; // Zurücksetzen für rechte Seite
    for (const info of businessInfoRight) {
      doc.text(info, pageWidth - marginRight - 50, yPosition);
      yPosition += 4;
    }
    yPosition = Math.max(yPosition, maxInfoY + businessInfoLeft.length * 4);
  }

  yPosition += 5;

  // === Trennline ===
  doc.setDrawColor(0);
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 5;

  // === Belegnummer, Datum, Tisch ===
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`GASTBELEG #${receipt.receiptNumber}`, marginLeft, yPosition);
  yPosition += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const dateStr = new Date(receipt.receiptDate).toLocaleDateString('de-DE');
  doc.text(`${dateStr} ${receipt.receiptTime}`, marginLeft, yPosition);
  yPosition += 5;

  if (receipt.guestName || receipt.tableNumber) {
    if (receipt.guestName) {
      doc.text(`Gast: ${receipt.guestName}`, marginLeft, yPosition);
      yPosition += 5;
    }
    if (receipt.tableNumber) {
      doc.text(`Tisch: ${receipt.tableNumber}`, marginLeft, yPosition);
      yPosition += 5;
    }
  }

  yPosition += 3;

  // === Artikel ===
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Artikel', marginLeft, yPosition);
  doc.text('Menge', marginLeft + 100, yPosition, { align: 'center' });
  doc.text('EP', marginLeft + 130, yPosition, { align: 'right' });
  doc.text('Gesamt', marginLeft + contentWidth, yPosition, { align: 'right' });
  yPosition += 6;

  // Trennline unter Header
  doc.setDrawColor(200);
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 3;

  // Artikel-Zeilen
  doc.setFont('helvetica', 'normal');
  for (const item of receipt.lineItems) {
    // Artikel-Name
    doc.setFontSize(9);
    doc.text(item.description, marginLeft, yPosition);

    // Steuersatz-Info in grau
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`(${item.taxRate}% MwSt)`, marginLeft + 2, yPosition + 4);
    doc.setTextColor(0);

    // Menge
    doc.setFontSize(9);
    doc.text(`${item.quantity}×`, marginLeft + 100, yPosition, { align: 'center' });

    // Einzelpreis (netto)
    doc.text(formatCurrencyDE(item.unitPriceNet), marginLeft + 130, yPosition, { align: 'right' });

    // Gesamtpreis (brutto)
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrencyDE(item.lineTotalGross), marginLeft + contentWidth, yPosition, {
      align: 'right',
    });
    doc.setFont('helvetica', 'normal');

    yPosition += 8;
  }

  yPosition += 2;

  // === Trennline ===
  doc.setDrawColor(0);
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 5;

  // === Steuerzusammenfassung ===
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  for (const tax of receipt.taxSummaries) {
    const netStr = formatCurrencyDE(tax.netTotal);
    const taxStr = formatCurrencyDE(tax.taxAmount);
    doc.text(`${tax.taxRate}% MwSt auf ${netStr}:`, marginLeft, yPosition);
    doc.text(taxStr, marginLeft + contentWidth, yPosition, { align: 'right' });
    yPosition += 4;
  }

  yPosition += 3;

  // === Summen ===
  yPosition += 5;

  // === Steuerzusammenfassung ===
  doc.text('Gesamtnetto:', marginLeft, yPosition);
  doc.text(formatCurrencyDE(receipt.totalNet), marginLeft + contentWidth, yPosition, {
    align: 'right',
  });
  yPosition += 6;

  // Steuern
  doc.setFont('helvetica', 'normal');
  doc.text('Gesamtsteuer:', marginLeft, yPosition);
  doc.text(formatCurrencyDE(receipt.totalTax), marginLeft + contentWidth, yPosition, {
    align: 'right',
  });
  yPosition += 6;

  // Gesamtbetrag (prominent)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const summaryBoxY = yPosition - 3;
  const summaryBoxHeight = 10;
  doc.setDrawColor(0);
  doc.rect(marginLeft - 1, summaryBoxY, contentWidth + 2, summaryBoxHeight);

  doc.text('GESAMTBETRAG:', marginLeft + 1, yPosition + 1);
  doc.text(formatCurrencyDE(receipt.totalGross), marginLeft + contentWidth - 1, yPosition + 1, {
    align: 'right',
  });

  yPosition += 10;

  // === Zahlungsinformation ===
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Zahlung:', marginLeft, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (isCashPayment(receipt.paymentDetails)) {
    doc.text('Zahlungsart: Bargeld', marginLeft, yPosition);
    yPosition += 4;
    doc.text(
      `Erhaltener Betrag: ${formatCurrencyDE(receipt.paymentDetails.amountReceived)}`,
      marginLeft,
      yPosition
    );
    yPosition += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Rückgeld: ${formatCurrencyDE(receipt.paymentDetails.changeGiven)}`,
      marginLeft,
      yPosition
    );
    doc.setFont('helvetica', 'normal');
    yPosition += 4;
  } else if (isCardPayment(receipt.paymentDetails)) {
    doc.text('Zahlungsart: Kartenzahlung', marginLeft, yPosition);
    yPosition += 4;
    if (receipt.paymentDetails.cardLast4) {
      doc.text(`Karte: **** **** **** ${receipt.paymentDetails.cardLast4}`, marginLeft, yPosition);
    }
  } else if (isTransferPayment(receipt.paymentDetails)) {
    doc.text('Zahlungsart: Überweisung', marginLeft, yPosition);
    yPosition += 4;
    if (receipt.paymentDetails.reference) {
      doc.text(`Referenz: ${receipt.paymentDetails.reference}`, marginLeft, yPosition);
    }
  }

  yPosition += 8;

  // === Fußbereich ===
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const footerText = options.footerText || 'Vielen Dank für Ihren Besuch!';
  doc.text(footerText, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  // === Manipulationsschutz Hash ===
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`SHA-256: ${receipt.receiptHash.substring(0, 32)}...`, marginLeft, pageHeight - 15, {
    maxWidth: contentWidth,
  });
  doc.text('Manipulationsschutz aktiviert', marginLeft, pageHeight - 10);
  doc.setTextColor(0);

  // === Speichern oder Anzeigen ===
  const filename = `Beleg-${receipt.receiptNumber.replace(/[\\]/g, '-')}.pdf`;

  if (options.preview) {
    // Öffne im Browser zum Drucken
    const dataUrl = doc.output('dataurlstring');
    window.open(dataUrl, '_blank');
  } else {
    // Speichern/Download
    doc.save(filename);
  }
}

/**
 * Druckt eine Quittung direkt (öffnet Print-Dialog)
 *
 * @param receipt Die GastBeleg zum Drucken
 */
export async function printReceipt(receipt: GastBeleg): Promise<void> {
  await exportReceiptToPDF(receipt, { preview: true });
}
