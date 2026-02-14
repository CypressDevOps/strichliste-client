/**
 * Receipt Validation Service
 * Prüft Quittungen auf Vollständigkeit, Korrektheit und Steuerkonformität
 */

import { GastBeleg, ReceiptLineItem } from './models';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Konstanten für Validierung
 */
const VALID_TAX_RATES = [0, 7, 19]; // Prozentsätze für Deutschland
const MAX_RECEIPT_ITEMS = 500;
const MAX_QUANTITY = 999;
const MAX_PRICE = 99999.99;

/**
 * Hilfsfunktion: Runde auf 2 Dezimalstellen (Cent-Präzision)
 */
export function roundToCent(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Validiert ein einzelnes Posten-Item
 */
function validateLineItem(item: ReceiptLineItem, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Beschreibung
  if (!item.description || item.description.trim().length === 0) {
    errors.push({
      field: `lineItems[${index}].description`,
      message: 'Artikelbeschreibung darf nicht leer sein',
      severity: 'error',
    });
  }

  // Menge
  if (item.quantity <= 0) {
    errors.push({
      field: `lineItems[${index}].quantity`,
      message: 'Menge muss größer als 0 sein',
      severity: 'error',
    });
  }

  if (item.quantity > MAX_QUANTITY) {
    errors.push({
      field: `lineItems[${index}].quantity`,
      message: `Menge kann nicht größer als ${MAX_QUANTITY} sein`,
      severity: 'error',
    });
  }

  // Einzelpreis Netto
  if (item.unitPriceNet < 0) {
    errors.push({
      field: `lineItems[${index}].unitPriceNet`,
      message: 'Preis darf nicht negativ sein',
      severity: 'error',
    });
  }

  if (item.unitPriceNet > MAX_PRICE) {
    errors.push({
      field: `lineItems[${index}].unitPriceNet`,
      message: `Preis kann nicht größer als ${MAX_PRICE}€ sein`,
      severity: 'error',
    });
  }

  // Steuersatz
  if (!VALID_TAX_RATES.includes(item.taxRate)) {
    errors.push({
      field: `lineItems[${index}].taxRate`,
      message: `Steuersatz muss einer der folgenden Werte sein: ${VALID_TAX_RATES.join(', ')}%`,
      severity: 'error',
    });
  }

  // Berechnung: lineTotalNet
  const expectedLineTotal = roundToCent(item.quantity * item.unitPriceNet);
  if (Math.abs(item.lineTotalNet - expectedLineTotal) > 0.01) {
    errors.push({
      field: `lineItems[${index}].lineTotalNet`,
      message: `Zeilensumme Netto stimmt nicht. Erwartet: ${expectedLineTotal}€, erhalten: ${item.lineTotalNet}€`,
      severity: 'error',
    });
  }

  // Berechnung: Steuerbetrag
  const expectedTax = roundToCent(item.lineTotalNet * (item.taxRate / 100));
  if (Math.abs(item.taxAmount - expectedTax) > 0.01) {
    errors.push({
      field: `lineItems[${index}].taxAmount`,
      message: `Steuerbetrag stimmt nicht. Erwartet: ${expectedTax}€, erhalten: ${item.taxAmount}€`,
      severity: 'error',
    });
  }

  // Berechnung: lineTotalGross
  const expectedGross = roundToCent(item.lineTotalNet + item.taxAmount);
  if (Math.abs(item.lineTotalGross - expectedGross) > 0.01) {
    errors.push({
      field: `lineItems[${index}].lineTotalGross`,
      message: `Zeilensumme Brutto stimmt nicht. Erwartet: ${expectedGross}€, erhalten: ${item.lineTotalGross}€`,
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validiert Geschäftsdaten
 */
function validateBusinessData(errors: ValidationError[], receipt: GastBeleg): void {
  const business = receipt.business;

  if (!business.businessName || business.businessName.trim().length === 0) {
    errors.push({
      field: 'business.businessName',
      message: 'Betriebsname ist erforderlich',
      severity: 'error',
    });
  }

  if (!business.address || business.address.trim().length === 0) {
    errors.push({
      field: 'business.address',
      message: 'Adresse ist erforderlich',
      severity: 'error',
    });
  }

  if (!business.taxNumber && !business.vatId) {
    errors.push({
      field: 'business.taxNumber / business.vatId',
      message: 'Entweder Steuernummer oder Umsatzsteuer-ID ist erforderlich',
      severity: 'error',
    });
  }

  if (business.logoPath && !business.logoPath.startsWith('/')) {
    errors.push({
      field: 'business.logoPath',
      message: 'Logo-Pfad muss mit / beginnen',
      severity: 'warning',
    });
  }
}

/**
 * Validiert Gesamtsummen
 */
function validateSummaries(errors: ValidationError[], receipt: GastBeleg): void {
  // Prüfe ob lineItems vorhanden sind
  if (!receipt.lineItems || receipt.lineItems.length === 0) {
    errors.push({
      field: 'lineItems',
      message: 'Quittung muss mindestens ein Posten enthalten',
      severity: 'error',
    });
    return;
  }

  if (receipt.lineItems.length > MAX_RECEIPT_ITEMS) {
    errors.push({
      field: 'lineItems',
      message: `Maximale Anzahl von ${MAX_RECEIPT_ITEMS} Positionen überschritten`,
      severity: 'error',
    });
  }

  // Berechne erwartete Summen
  let expectedTotalNet = 0;
  let expectedTotalTax = 0;

  for (const item of receipt.lineItems) {
    expectedTotalNet = roundToCent(expectedTotalNet + item.lineTotalNet);
    expectedTotalTax = roundToCent(expectedTotalTax + item.taxAmount);
  }

  const expectedTotalGross = roundToCent(expectedTotalNet + expectedTotalTax);

  // Vergleiche mit Quittung
  if (Math.abs(receipt.totalNet - expectedTotalNet) > 0.01) {
    errors.push({
      field: 'totalNet',
      message: `Gesamtbetrag Netto stimmt nicht. Erwartet: ${expectedTotalNet}€, erhalten: ${receipt.totalNet}€`,
      severity: 'error',
    });
  }

  if (Math.abs(receipt.totalTax - expectedTotalTax) > 0.01) {
    errors.push({
      field: 'totalTax',
      message: `Gesamtsteuer stimmt nicht. Erwartet: ${expectedTotalTax}€, erhalten: ${receipt.totalTax}€`,
      severity: 'error',
    });
  }

  if (Math.abs(receipt.totalGross - expectedTotalGross) > 0.01) {
    errors.push({
      field: 'totalGross',
      message: `Gesamtbetrag Brutto stimmt nicht. Erwartet: ${expectedTotalGross}€, erhalten: ${receipt.totalGross}€`,
      severity: 'error',
    });
  }

  // Validiere Tax Summaries
  if (!receipt.taxSummaries || receipt.taxSummaries.length === 0) {
    errors.push({
      field: 'taxSummaries',
      message: 'Steuersummaries dürfen nicht leer sein',
      severity: 'error',
    });
  }

  // Prüfe Steuersummaries-Spalte
  let summedTax = 0;
  let summedNet = 0;

  for (const summary of receipt.taxSummaries || []) {
    if (!VALID_TAX_RATES.includes(summary.taxRate)) {
      errors.push({
        field: 'taxSummaries',
        message: `Ungültiger Steuersatz in Steuersummary: ${summary.taxRate}%`,
        severity: 'error',
      });
    }

    summedNet = roundToCent(summedNet + summary.netTotal);
    summedTax = roundToCent(summedTax + summary.taxAmount);
  }

  if (Math.abs(summedNet - receipt.totalNet) > 0.01) {
    errors.push({
      field: 'taxSummaries',
      message: 'Nettosummen in Steuersummaries addieren sich nicht zu totalNet auf',
      severity: 'error',
    });
  }

  if (Math.abs(summedTax - receipt.totalTax) > 0.01) {
    errors.push({
      field: 'taxSummaries',
      message: 'Steuersummen in Steuersummaries addieren sich nicht zu totalTax auf',
      severity: 'error',
    });
  }
}

/**
 * Validiert Zahlung
 */
function validatePayment(errors: ValidationError[], receipt: GastBeleg): void {
  if (!receipt.paymentDetails) {
    errors.push({
      field: 'paymentDetails',
      message: 'Zahlungsart ist erforderlich',
      severity: 'error',
    });
    return;
  }

  // Für Barzahlung: Rückgeld muss logisch sein
  if (receipt.paymentDetails.method === 'CASH') {
    const cash = receipt.paymentDetails;
    if (cash.amountReceived < receipt.totalGross) {
      errors.push({
        field: 'paymentDetails.amountReceived',
        message: `Erhaltener Betrag (${cash.amountReceived}€) ist kleiner als Gesamtbetrag (${receipt.totalGross}€)`,
        severity: 'error',
      });
    }

    const expectedChange = roundToCent(cash.amountReceived - receipt.totalGross);
    if (Math.abs(cash.changeGiven - expectedChange) > 0.01) {
      errors.push({
        field: 'paymentDetails.changeGiven',
        message: `Rückgeld stimmt nicht. Erwartet: ${expectedChange}€, erhalten: ${cash.changeGiven}€`,
        severity: 'error',
      });
    }
  }
}

/**
 * Validiert Hash-Existenz
 */
function validateHash(errors: ValidationError[], receipt: GastBeleg): void {
  if (!receipt.receiptHash || receipt.receiptHash.trim().length === 0) {
    errors.push({
      field: 'receiptHash',
      message: 'Hash (Manipulationsschutz) darf nicht leer sein',
      severity: 'error',
    });
  }

  if (receipt.hashAlgorithm !== 'SHA-256') {
    errors.push({
      field: 'hashAlgorithm',
      message: 'Nur SHA-256 ist unterstützt',
      severity: 'error',
    });
  }
}

/**
 * Hauptvalidierungsfunktion
 */
export function validateReceipt(receipt: GastBeleg): ValidationResult {
  const errors: ValidationError[] = [];

  // Grundlegende Felder
  if (!receipt.receiptNumber || receipt.receiptNumber.trim().length === 0) {
    errors.push({
      field: 'receiptNumber',
      message: 'Belegnummer ist erforderlich',
      severity: 'error',
    });
  }

  if (!receipt.receiptDate || receipt.receiptDate.trim().length === 0) {
    errors.push({
      field: 'receiptDate',
      message: 'Belegdatum ist erforderlich',
      severity: 'error',
    });
  }

  if (receipt.currency !== 'EUR') {
    errors.push({
      field: 'currency',
      message: 'Nur EUR wird unterstützt',
      severity: 'error',
    });
  }

  // Prüfe Line Items
  if (receipt.lineItems && receipt.lineItems.length > 0) {
    for (let i = 0; i < receipt.lineItems.length; i++) {
      const itemErrors = validateLineItem(receipt.lineItems[i], i);
      errors.push(...itemErrors);
    }
  }

  // Prüfe Geschäftsdaten
  validateBusinessData(errors, receipt);

  // Prüfe Summen
  validateSummaries(errors, receipt);

  // Prüfe Zahlung
  validatePayment(errors, receipt);

  // Prüfe Hash
  validateHash(errors, receipt);

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Wirft Error wenn Validierung fehlschlägt
 */
export function validateReceiptOrThrow(receipt: GastBeleg): void {
  const result = validateReceipt(receipt);
  if (!result.valid) {
    const errorMessages = result.errors
      .filter((e) => e.severity === 'error')
      .map((e) => `${e.field}: ${e.message}`)
      .join('\n');
    throw new Error(`Quittungsvalidierung fehlgeschlagen:\n${errorMessages}`);
  }
}
