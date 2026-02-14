/**
 * Receipt Hash Service
 * Generiert SHA-256 Hashes für Manipulationserkennung von Quittungen
 */

import { GastBeleg, ReceiptLineItem } from './models';

/**
 * Generiert einen SHA-256 Hash aus den kritischen Quittungs-Daten
 * Hash basiert auf:
 * - Belegnummer
 * - Belegdatum
 * - Alle Positionen (Beschreibung, Menge, Preise)
 * - Alle Steuerzusammenfassungen
 * - Gesamtbruttobetrag
 *
 * @param receipt Die Quittung (ohne Hash)
 * @returns SHA-256 hex-String
 */
export async function generateReceiptHash(
  receipt: Omit<GastBeleg, 'receiptHash'>
): Promise<string> {
  // Stelle sicher, dass crypto API verfügbar ist (Browser/Node.js)
  let crypto: Crypto | null = globalThis.crypto || null;
  if (!crypto && typeof global !== 'undefined') {
    try {
      const globalObj = global as Record<string, unknown>;
      crypto = (globalObj.crypto as Crypto) || null;
    } catch {
      // Crypto nicht verfügbar
    }
  }

  // Construire Daten-String für Hashing
  const dataToHash = JSON.stringify({
    receiptNumber: receipt.receiptNumber,
    receiptDate: receipt.receiptDate,
    receiptTime: receipt.receiptTime,
    lineItems: receipt.lineItems.map((item: ReceiptLineItem) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceNet: item.unitPriceNet,
      taxRate: item.taxRate,
      lineTotalNet: item.lineTotalNet,
      taxAmount: item.taxAmount,
      lineTotalGross: item.lineTotalGross,
    })),
    totalNet: receipt.totalNet,
    totalTax: receipt.totalTax,
    totalGross: receipt.totalGross,
    paymentMethod: receipt.paymentDetails.method,
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);

  try {
    // Nutze Web Crypto API wenn verfügbar (moderne Browser)
    if (crypto && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    console.warn('Web Crypto API nicht verfügbar, fallback zu lokalem Hash');
  }

  // Fallback: Simple lokale Hash-Funktion (nicht kryptografisch sicher, aber besser als nichts)
  return generateSimpleHash(dataToHash);
}

/**
 * Fallback: Einfache deterministische Hash-Funktion
 * WARNUNG: Dies ist NICHT kryptografisch sicher!
 * Nur für Entwicklung/Testing, in Produktion Web Crypto verwenden
 */
function generateSimpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Erweitere auf 64 Zeichen (SHA-256 ähnlich)
  const hex = (Math.abs(hash) >>> 0).toString(16).padStart(8, '0');
  const extended =
    hex +
    data
      .substring(0, 56)
      .split('')
      .map((c) => c.charCodeAt(0).toString(16))
      .join('');
  return extended.substring(0, 64).padEnd(64, '0');
}

/**
 * Verifiziert dass der Hash einer Quittung noch korrekt ist
 * (Manipulationserkennung)
 *
 * @param receipt Die komplette Quittung mit Hash
 * @returns true wenn Hash korrekt, false wenn manipuliert
 */
export async function verifyReceiptHash(receipt: GastBeleg): Promise<boolean> {
  const { receiptHash, ...receiptWithoutHash } = receipt;
  const calculatedHash = await generateReceiptHash(receiptWithoutHash);
  return calculatedHash === receiptHash;
}

/**
 * Generiert einen Hashwert synchron (mit Fallback)
 * Nutze dies nur wenn async nicht möglich ist
 */
export function generateReceiptHashSync(receipt: Omit<GastBeleg, 'receiptHash'>): string {
  const dataToHash = JSON.stringify({
    receiptNumber: receipt.receiptNumber,
    receiptDate: receipt.receiptDate,
    receiptTime: receipt.receiptTime,
    lineItems: receipt.lineItems.map((item: ReceiptLineItem) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceNet: item.unitPriceNet,
      taxRate: item.taxRate,
      lineTotalNet: item.lineTotalNet,
      taxAmount: item.taxAmount,
      lineTotalGross: item.lineTotalGross,
    })),
    totalNet: receipt.totalNet,
    totalTax: receipt.totalTax,
    totalGross: receipt.totalGross,
    paymentMethod: receipt.paymentDetails.method,
  });

  return generateSimpleHash(dataToHash);
}
