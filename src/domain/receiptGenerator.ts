/**
 * Receipt Generator Service
 * Generiert professionelle Gastbelege (Quittungen) aus Transaktionsdaten
 */

import {
  GastBeleg,
  ReceiptLineItem,
  TaxSummary,
  BusinessData,
  Transaction,
  PaymentDetails,
  PaymentMethod,
} from './models';
import { generateReceiptHashSync } from './receiptHash';
import { validateReceiptOrThrow } from './receiptValidation';

/**
 * Runde auf 2 Dezimalstellen (EUR-Präzision)
 */
function roundToCent(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formatiert Datum zu deutschem Format: TT.MM.JJJJ
 */
function formatGermanDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Formatiert Zeit zu deutschem Format: HH:mm:ss
 */
function formatGermanTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Generiert eindeutige Belegnummer
 * Format: RCP-JJJJ-NNNNN
 */
function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `RCP-${year}-${random}`;
}

/**
 * Konvertiert Transaktionen zu ReceiptLineItems
 * Gruppiert doppelte Produkte und berechnet Steuern
 *
 * @param transactions Transaktionen vom Deckel (mit .sum < 0 für Verkäufe)
 * @param taxRateMap Mapping von Produktname zu Steuersatz (optional)
 */
function transactionsToLineItems(
  transactions: Transaction[],
  taxRateMap?: Map<string, number>
): ReceiptLineItem[] {
  // Gruppiere Transaktionen nach Produktname
  const itemMap = new Map<string, { quantity: number; totalNet: number }>();

  for (const tx of transactions) {
    // Nur negative Transaktionen sind Verkäufe
    if (tx.sum >= 0) continue;

    const amount = Math.abs(tx.sum);
    const quantity = Math.abs(tx.count || 1);

    if (itemMap.has(tx.description)) {
      const existing = itemMap.get(tx.description)!;
      existing.quantity += quantity;
      existing.totalNet = roundToCent(existing.totalNet + amount);
    } else {
      itemMap.set(tx.description, {
        quantity,
        totalNet: roundToCent(amount),
      });
    }
  }

  // Konvertiere zu ReceiptLineItems mit Steuern
  const items: ReceiptLineItem[] = [];

  for (const [description, data] of itemMap.entries()) {
    const taxRate = taxRateMap?.get(description) ?? 19; // Default: 19% VAT
    const unitPriceNet = roundToCent(data.totalNet / data.quantity);
    const taxAmount = roundToCent(data.totalNet * (taxRate / 100));
    const lineTotalGross = roundToCent(data.totalNet + taxAmount);

    items.push({
      description,
      quantity: Math.round(data.quantity), // Stelle sicher ganz Zahl
      unitPriceNet,
      taxRate,
      lineTotalNet: data.totalNet,
      taxAmount,
      lineTotalGross,
    });
  }

  return items;
}

/**
 * Berechnet Steuersummaries aus LineItems
 */
function calculateTaxSummaries(lineItems: ReceiptLineItem[]): TaxSummary[] {
  const summaryMap = new Map<number, TaxSummary>();

  for (const item of lineItems) {
    if (!summaryMap.has(item.taxRate)) {
      summaryMap.set(item.taxRate, {
        taxRate: item.taxRate,
        netTotal: 0,
        taxAmount: 0,
        grossTotal: 0,
      });
    }

    const summary = summaryMap.get(item.taxRate)!;
    summary.netTotal = roundToCent(summary.netTotal + item.lineTotalNet);
    summary.taxAmount = roundToCent(summary.taxAmount + item.taxAmount);
    summary.grossTotal = roundToCent(summary.grossTotal + item.lineTotalGross);
  }

  return Array.from(summaryMap.values()).sort((a, b) => b.taxRate - a.taxRate);
}

/**
 * Hauptfunktion: Generiert eine professionelle Quittung
 *
 * @param params Konfiguration für Quittungserstellung
 */
export interface GenerateReceiptParams {
  /** Geschäftsdaten (Name, Adresse, Steuernummer etc) */
  business: BusinessData;
  /** Transaktionen des Gastes */
  transactions: Transaction[];
  /** Zahlungsart und Details */
  paymentMethod: PaymentMethod;
  paymentDetails?: Partial<PaymentDetails>;
  /** Optional: Gast-Name */
  guestName?: string;
  /** Optional: Tischnummer */
  tableNumber?: string;
  /** Optional: Mapping für Steuersätze */
  taxRateMap?: Map<string, number>;
}

export async function generateReceipt(params: GenerateReceiptParams): Promise<GastBeleg> {
  // 1. Konvertiere Transaktionen zu LineItems
  const lineItems = transactionsToLineItems(params.transactions, params.taxRateMap);

  if (lineItems.length === 0) {
    throw new Error('Keine Verkäufe gefunden - Quittung kann nicht erstellt werden');
  }

  // 2. Berechne Summen
  const totalNet = roundToCent(
    lineItems.reduce((sum, item) => sum + item.lineTotalNet, 0)
  );
  const totalTax = roundToCent(lineItems.reduce((sum, item) => sum + item.taxAmount, 0));
  const totalGross = roundToCent(totalNet + totalTax);

  const taxSummaries = calculateTaxSummaries(lineItems);

  // 3. Erstelle Zahlungs-Details
  let paymentDetails: PaymentDetails;

  if (params.paymentMethod === 'CASH') {
    const cashPayment = params.paymentDetails as { amountReceived?: number } | undefined;
    const amountReceived = cashPayment?.amountReceived ?? totalGross;
    const changeGiven = roundToCent(amountReceived - totalGross);

    paymentDetails = {
      method: 'CASH',
      amountReceived,
      changeGiven,
    };
  } else if (params.paymentMethod === 'CARD') {
    const cardPayment = params.paymentDetails as { cardLast4?: string } | undefined;
    paymentDetails = {
      method: 'CARD',
      cardLast4: cardPayment?.cardLast4,
    };
  } else if (params.paymentMethod === 'TRANSFER') {
    const transferPayment = params.paymentDetails as { reference?: string } | undefined;
    paymentDetails = {
      method: 'TRANSFER',
      reference: transferPayment?.reference,
    };
  } else {
    // Fallback für unbekannte Zahlungsarten (z.B. CRYPTO, OTHER)
    paymentDetails = { method: 'OTHER' };
  }

  // 4. Erstelle Belegobjekt (ohne Hash zunächst)
  const now = new Date();

  const receiptWithoutHash: Omit<GastBeleg, 'receiptHash'> = {
    receiptNumber: generateReceiptNumber(),
    receiptDate: now.toISOString(), // ISO 8601
    receiptTime: formatGermanTime(now),
    business: params.business,
    lineItems,
    totalNet,
    taxSummaries,
    totalTax,
    totalGross,
    paymentDetails,
    currency: 'EUR',
    hashAlgorithm: 'SHA-256',
    guestName: params.guestName,
    tableNumber: params.tableNumber,
    readonly: true,
  };

  // 5. Generiere Hash
  const receiptHash = generateReceiptHashSync(receiptWithoutHash);

  // 6. Erstelle finale Quittung
  const receipt: GastBeleg = {
    ...receiptWithoutHash,
    receiptHash,
  };

  // 7. Validiere Quittung
  try {
    validateReceiptOrThrow(receipt);
  } catch (err) {
    console.error('Quittungsvalidierung fehlgeschlagen:', err);
    throw err;
  }

  return receipt;
}

/**
 * Export für Tests/Debugging
 */
export const receiptGeneratorUtils = {
  formatGermanDate,
  formatGermanTime,
  roundToCent,
  transactionsToLineItems,
  calculateTaxSummaries,
};
