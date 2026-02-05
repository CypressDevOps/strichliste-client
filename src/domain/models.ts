// src/domain/models.ts

//export type DeckelStatus = 'OFFEN' | 'BEZAHLT' | 'HISTORISCH';
export const DECKEL_STATUS = {
  OFFEN: 'OFFEN',
  BEZAHLT: 'BEZAHLT',
  HISTORISCH: 'HISTORISCH',
  GESCHLOSSEN: 'GESCHLOSSEN',
} as const;

export type DeckelStatus = (typeof DECKEL_STATUS)[keyof typeof DECKEL_STATUS];
export interface Transaction {
  /** Datum der Transaktion (Date oder ISO-String) */
  date: Date | string;
  /** Kurztext, z. B. 'Einzahlung' oder 'Getränke' */
  description: string;
  /** Anzahl (z. B. 1 für eine Einzahlung, 2 für zwei Artikel) */
  count: number;
  /** Betrag in Euro (positiv für Einzahlung, negativ für Ausgabe) */
  sum: number;
  /** Optional: eindeutige ID für die Transaktion (nützlich zum Löschen/Bearbeiten) */
  id?: string;
}

export interface DeckelUIState {
  id: string; // Eindeutige ID
  name: string; // Name des Gasts oder Tischnummer
  status: DeckelStatus; // OFFEN, BEZAHLT oder HISTORISCH
  isSelected: boolean; // Details werden rechts angezeigt
  isActive: boolean; // Nur true bei OFFEN + ausgewählt
  lastActivity: Date; // Zuletzt aktiv
  transactions?: Transaction[]; // Liste der Transaktionen (optional)
}
