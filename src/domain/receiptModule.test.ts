/**
 * Unit Tests für Receipt Module
 * Testet: Validierung, Hash-Generierung und Quittungenerierung
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GastBeleg,
  ReceiptLineItem,
  TaxSummary,
  BusinessData,
  CashPayment,
  Transaction,
} from './models';
import { validateReceipt, validateReceiptOrThrow, roundToCent } from './receiptValidation';
import { generateReceiptHash, verifyReceiptHash, generateReceiptHashSync } from './receiptHash';
import { generateReceipt } from './receiptGenerator';

// === Test Fixtures ===

const mockBusinessData: BusinessData = {
  businessName: 'Test Gasthaus',
  address: 'Teststraße 1\n12345 Teststadt',
  taxNumber: '12 345 678 901',
  vatId: 'DE123456789',
  phone: '030 123456',
  email: 'test@gasthaus.de',
};

const mockLineItems: ReceiptLineItem[] = [
  {
    description: 'Bier 0,5l',
    quantity: 3,
    unitPriceNet: 2.5,
    taxRate: 19,
    lineTotalNet: 7.5,
    taxAmount: 1.425,
    lineTotalGross: 8.925,
  },
  {
    description: 'Brezel',
    quantity: 1,
    unitPriceNet: 1.0,
    taxRate: 7,
    lineTotalNet: 1.0,
    taxAmount: 0.07,
    lineTotalGross: 1.07,
  },
];

const mockTaxSummaries: TaxSummary[] = [
  {
    taxRate: 19,
    netTotal: 7.5,
    taxAmount: 1.425,
    grossTotal: 8.925,
  },
  {
    taxRate: 7,
    netTotal: 1.0,
    taxAmount: 0.07,
    grossTotal: 1.07,
  },
];

const mockPaymentDetails: CashPayment = {
  method: 'CASH',
  amountReceived: 15.0,
  changeGiven: 4.98,
};

const mockReceipt: GastBeleg = {
  receiptNumber: 'RCP-2026-00001',
  receiptDate: new Date().toISOString(),
  receiptTime: '14:30:00',
  business: mockBusinessData,
  lineItems: mockLineItems,
  totalNet: 8.5,
  taxSummaries: mockTaxSummaries,
  totalTax: 1.495,
  totalGross: 9.995,
  paymentDetails: mockPaymentDetails,
  currency: 'EUR',
  receiptHash: 'abc123hash',
  hashAlgorithm: 'SHA-256',
  guestName: 'Max Mustermann',
  tableNumber: '5',
  readonly: true,
};

// === Validierungstests ===

describe('Receipt Validation', () => {
  it('sollte eine gültige Quittung validieren', () => {
    const result = validateReceipt(mockReceipt);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('sollte fehlende Geschäftsdaten erkennen', () => {
    const invalidBusiness: BusinessData = { businessName: '' } as BusinessData & {
      businessName: string;
    };
    const invalid = { ...mockReceipt, business: invalidBusiness };
    const result = validateReceipt(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('sollte negative Preise erkennen', () => {
    const invalid = {
      ...mockReceipt,
      lineItems: [{ ...mockLineItems[0], unitPriceNet: -2.5 }],
    };
    const result = validateReceipt(invalid);
    expect(result.valid).toBe(false);
  });

  it('sollte ungültige Steuersätze erkennen', () => {
    const invalid = {
      ...mockReceipt,
      lineItems: [{ ...mockLineItems[0], taxRate: 42 }],
    };
    const result = validateReceipt(invalid);
    expect(result.valid).toBe(false);
  });

  it('sollte Rechenfehler bei Steuern erkennen', () => {
    const invalid = {
      ...mockReceipt,
      lineItems: [
        {
          ...mockLineItems[0],
          taxAmount: 99.99, // Klar falsch
        },
      ],
    };
    const result = validateReceipt(invalid);
    expect(result.valid).toBe(false);
  });

  it('sollte bei CASH-Zahlung zu wenig Rückgeld erkennen', () => {
    const invalid = {
      ...mockReceipt,
      paymentDetails: {
        method: 'CASH' as const,
        amountReceived: 10.0,
        changeGiven: 5.0, // Zu viel!
      },
    };
    const result = validateReceipt(invalid);
    expect(result.valid).toBe(false);
  });

  it('sollte validateReceiptOrThrow werfen bei ungültigen Daten', () => {
    const invalid = { ...mockReceipt, totalGross: -1 };
    expect(() => validateReceiptOrThrow(invalid)).toThrow();
  });
});

// === Rounding Tests ===

describe('Currency Rounding', () => {
  it('sollte auf 2 Dezimalstellen runden', () => {
    expect(roundToCent(1.234)).toBe(1.23);
    expect(roundToCent(1.235)).toBe(1.24);
    expect(roundToCent(1.225)).toBe(1.23);
  });

  it('sollte Floating-Point Fehler handhaben', () => {
    // Klassisches Floating-Point Problem: 0.1 + 0.2 !== 0.3
    const result = roundToCent(0.1 + 0.2);
    expect(result).toBe(0.3);
  });

  it('sollte negative Beträge handhaben', () => {
    expect(roundToCent(-1.234)).toBe(-1.23);
  });
});

// === Hash Tests ===

describe('Receipt Hash', () => {
  let hashValue: string;

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptHash: _unused, ...receiptForHash } = mockReceipt;
    hashValue = await generateReceiptHash(receiptForHash);
  });

  it('sollte einen Hash generieren', () => {
    expect(hashValue).toBeTruthy();
    expect(hashValue.length).toBeGreaterThan(0);
  });

  it('sollte konsistente Hashes für identische Quittungen erzeugen', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptHash: _h1, ...forHash1 } = mockReceipt;
    const generatedHash1 = await generateReceiptHash(forHash1);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptHash: _h2, ...forHash2 } = mockReceipt;
    const generatedHash2 = await generateReceiptHash(forHash2);

    expect(generatedHash1).toBe(generatedHash2);
  });

  it('sollte verschiedene Hashes für unterschiedliche Quittungen erzeugen', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptHash: _h1, ...forHash1 } = mockReceipt;
    const hash1Generated = await generateReceiptHash(forHash1);

    const modified = { ...mockReceipt, totalGross: 99.99 };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptHash: _h2, ...forHash2 } = modified;
    const hash2Generated = await generateReceiptHash(forHash2);

    expect(hash1Generated).not.toBe(hash2Generated);
  });

  it('should verify correct hashes', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptHash: _unused, ...receiptData } = mockReceipt;
    const newHash = await generateReceiptHash(receiptData);
    const receiptWithHash: GastBeleg = {
      ...receiptData,
      receiptHash: newHash,
    };

    const isValid = await verifyReceiptHash(receiptWithHash);
    expect(isValid).toBe(true);
  });

  it('sollte manipulierte Quittungen erkennen', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptHash: _unused, ...receiptData } = mockReceipt;
    const newHash = await generateReceiptHash(receiptData);
    const receiptWithHash: GastBeleg = {
      ...receiptData,
      receiptHash: newHash,
    };

    // Manipuliere die Quittung
    const manipulatedReceipt = { ...receiptWithHash, totalGross: 99.99 };

    const isValid = await verifyReceiptHash(manipulatedReceipt);
    expect(isValid).toBe(false);
  });

  it('sollte synchrone Hash-Generierung unterstützen', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptHash: _unused, ...receiptData } = mockReceipt;
    const syncHash = generateReceiptHashSync(receiptData);

    expect(syncHash).toBeTruthy();
    expect(syncHash.length).toBeGreaterThan(0);
  });
});

// === Generator Tests ===

describe('Receipt Generator', () => {
  it('sollte aus Transaktionen eine Quittung generieren', async () => {
    const transactions: Transaction[] = [
      {
        date: new Date(),
        description: 'Bier 0,5l',
        count: 3,
        sum: 8.93,
      },
      {
        date: new Date(),
        description: 'Brezel',
        count: 1,
        sum: 1.07,
      },
    ];

    const receipt = await generateReceipt({
      business: mockBusinessData,
      transactions,
      paymentMethod: 'CASH',
      paymentDetails: { amountReceived: 15.0 },
      guestName: 'Test Guest',
    });

    expect(receipt).toBeDefined();
    expect(receipt.receiptNumber).toMatch(/^RCP-\d{4}-\d{5}$/);
    expect(receipt.lineItems.length).toBe(2);
    expect(receipt.totalGross).toBeCloseTo(9.99, 2);
    expect(receipt.receiptHash).toBeTruthy();
  });

  it('sollte Steuern korrekt berechnen', async () => {
    const transactions: Transaction[] = [
      {
        date: new Date(),
        description: 'Bier (19%)',
        count: 1,
        sum: 5.95, // 5€ netto + 19% steuer
      },
    ];

    const receipt = await generateReceipt({
      business: mockBusinessData,
      transactions,
      paymentMethod: 'OTHER',
    });

    expect(receipt.totalTax).toBeGreaterThan(0);
    expect(receipt.totalGross).toBeGreaterThan(receipt.totalNet);
  });

  it('sollte für CASH-Zahlung das Rückgeld berechnen', async () => {
    const transactions: Transaction[] = [
      {
        date: new Date(),
        description: 'Bier',
        count: 1,
        sum: 4.0,
      },
    ];

    const receipt = await generateReceipt({
      business: mockBusinessData,
      transactions,
      paymentMethod: 'CASH',
      paymentDetails: { amountReceived: 10.0 },
    });

    if (receipt.paymentDetails.method === 'CASH') {
      expect(receipt.paymentDetails.changeGiven).toBeCloseTo(
        receipt.paymentDetails.amountReceived - receipt.totalGross,
        2
      );
    }
  });

  it('sollte zuverlässigen Hash generieren', async () => {
    const transactions: Transaction[] = [
      {
        date: new Date(),
        description: 'Test Artikel',
        count: 1,
        sum: 5.0,
      },
    ];

    const receipt1 = await generateReceipt({
      business: mockBusinessData,
      transactions,
      paymentMethod: 'OTHER',
    });

    const receipt2 = await generateReceipt({
      business: mockBusinessData,
      transactions,
      paymentMethod: 'OTHER',
    });

    // Hashes sollten unterschiedlich sein (unterschiedliche Belegnummern/Zeiten)
    expect(receipt1.receiptHash).not.toEqual(receipt2.receiptHash);
  });

  it('sollte validierte Quittungen erzeugen', async () => {
    const transactions: Transaction[] = [
      {
        date: new Date(),
        description: 'Artikel',
        count: 1,
        sum: 3.57,
      },
    ];

    const receipt = await generateReceipt({
      business: mockBusinessData,
      transactions,
      paymentMethod: 'CARD',
      paymentDetails: { cardLast4: '1234' },
    });

    const validation = validateReceipt(receipt);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});

// === Integration Tests ===

describe('Receipt Module Integration', () => {
  it('sollte complete Prozess: Generierung -> Validierung -> Hashverifikation durchführen', async () => {
    const transactions: Transaction[] = [
      { date: new Date(), description: 'Getränk', count: 2, sum: 6.0 },
      { date: new Date(), description: 'Essen', count: 1, sum: 8.0 },
    ];

    // 1. Generiere
    const receipt = await generateReceipt({
      business: mockBusinessData,
      transactions,
      paymentMethod: 'CASH',
      paymentDetails: { amountReceived: 20.0 },
    });

    // 2. Validiere
    const validation = validateReceipt(receipt);
    expect(validation.valid).toBe(true);

    // 3. Verifiziere Hash
    const hashValid = await verifyReceiptHash(receipt);
    expect(hashValid).toBe(true);

    // 4. Manipuliere und erkenne
    const manipulatedReceipt = { ...receipt, totalGross: 999.99 };
    const manipulationDetected = await verifyReceiptHash(manipulatedReceipt);
    expect(manipulationDetected).toBe(false);
  });
});
