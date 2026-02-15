// src/domain/models.ts

export const DECKEL_STATUS = {
  OFFEN: 'OFFEN',
  WEG: 'WEG',
  GONE: 'GONE',
  BEZAHLT: 'BEZAHLT',
  HISTORISCH: 'HISTORISCH',
  GESCHLOSSEN: 'GESCHLOSSEN',
} as const;

export type DeckelStatus = (typeof DECKEL_STATUS)[keyof typeof DECKEL_STATUS];

export interface Transaction {
  id?: string;
  date: Date | string;
  description: string;
  count: number;
  sum: number;
  /** Optionales Feld: Zeigt von welchem Gast-Deckel die Transaktion übertragen wurde */
  transferredFrom?: string;
  /** Bei Barzahlung mit Rückgeld: Der tatsächlich erhaltene Betrag */
  amountReceived?: number;
  /** Bei Barzahlung mit Rückgeld: Das zurückgegebene Wechselgeld */
  changeGiven?: number;
  /** Markiert einen Trinkgeld-Eintrag (wird nicht in Umsatzstatistik aufgenommen) */
  isTip?: boolean;
}

export interface DeckelUIState {
  id: string;
  /** Persistente Gast‑Identität; falls nicht vorhanden, wird beim Laden auf id gesetzt */
  ownerId?: string;
  name: string;
  status: DeckelStatus;
  isSelected: boolean;
  isActive: boolean;
  lastActivity: Date | string;
  transactions?: Transaction[];
  rootKey?: string;
}

export type ProductCategory =
  | 'Bier'
  | 'Alkoholfreie Getränke'
  | 'Schnaps'
  | 'Sekt / Schaumwein'
  | 'Snacks';

export interface Product {
  id: string;
  name: string;
  price: number;
  icon: string;
  emoji?: string;
  category: ProductCategory;
  sortOrder: number;
  isActive: boolean;
}

// ===== PROFESSIONAL RECEIPT MODELS (GASTBELEG) =====

/**
 * Geschäftsdaten (unveränderlich nach Erstellung)
 * Enthält Firmeninformationen für den Beleg-Header
 */
export interface BusinessData {
  /** Firmenname/Betriebsstätte */
  businessName: string;
  /** Vollständige Anschrift */
  address: string;
  /** Steuernummer (z.B. 12 345 678 901) */
  taxNumber?: string;
  /** Umsatzsteuer-ID (z.B. DE123456789) */
  vatId?: string;
  /** Optional: Telefon */
  phone?: string;
  /** Optional: Email */
  email?: string;
  /** Logo-Pfad (z.B. /images/logo.png) */
  logoPath?: string;
  /** Optional: Deckel-Hintergrund (z.B. /assets/Deckelhintergrund.png) */
  backgroundPath?: string;
}

/**
 * Position auf der Quittung (Verkaufter Artikel)
 */
export interface ReceiptLineItem {
  /** Artikel-Bezeichnung */
  description: string;
  /** Verkaufte Menge */
  quantity: number;
  /** Preis pro Einheit (NETTO in EUR) */
  unitPriceNet: number;
  /** Mehrwertsteuersatz in % (z.B. 19, 7, 0) */
  taxRate: number;
  /** Berechnet: Netto-Gesamt = quantity * unitPriceNet */
  lineTotalNet: number;
  /** Berechnet: Steuerbetrag = lineTotalNet * (taxRate/100) */
  taxAmount: number;
  /** Berechnet: Brutto-Gesamt = lineTotalNet + taxAmount */
  lineTotalGross: number;
}

/**
 * Zahlungsart
 */
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CRYPTO' | 'OTHER';

/**
 * Bargeldzahlung mit Rückgeld
 */
export interface CashPayment {
  method: 'CASH';
  amountReceived: number;
  changeGiven: number;
  tip?: number;
}

/**
 * Kartenzahlung
 */
export interface CardPayment {
  method: 'CARD';
  cardLast4?: string;
}

/**
 * Überweisung
 */
export interface TransferPayment {
  method: 'TRANSFER';
  reference?: string;
}

export type PaymentDetails = CashPayment | CardPayment | TransferPayment | { method: 'OTHER' };

/**
 * Steuerzusammenfassung (gruppiert nach Steuersatz)
 */
export interface TaxSummary {
  taxRate: number; // z.B. 19, 7, 0
  netTotal: number;
  taxAmount: number;
  grossTotal: number;
}

/**
 * Immutable Receipt Object
 * Nach Erstellung nicht veränderbar
 */
export interface GastBeleg {
  // === IDENTIFIKATION ===
  receiptNumber: string; // Eindeutige Belegnummer (z.B. RCP-2026-001)
  receiptDate: string; // ISO 8601 mit Zeitzone
  receiptTime: string; // HH:mm:ss

  // === GESCHÄFTSDATEN ===
  business: BusinessData;

  // === POSITIONEN ===
  lineItems: ReceiptLineItem[];

  // === SUMMEN ===
  /** Gesamtnettobetrag aller Positionen */
  totalNet: number;
  /** Steuersätze mit Beträgen */
  taxSummaries: TaxSummary[];
  /** Gesamtsteuerbetrag */
  totalTax: number;
  /** Gesamtbruttobetrag (totalNet + totalTax) */
  totalGross: number;

  // === ZAHLUNG ===
  paymentDetails: PaymentDetails;
  currency: 'EUR'; // ISO 4217

  // === MANIPULATIONSSCHUTZ ===
  receiptHash: string; // SHA-256 hex
  hashAlgorithm: 'SHA-256';

  // === METADATEN ===
  guestName?: string; // Optionaler Gas-Name
  tableNumber?: string; // Falls vorhanden
  readonly: true; // Flag dass Beleg unveränderlich ist
}
