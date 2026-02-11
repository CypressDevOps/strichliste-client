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
  category: ProductCategory;
  sortOrder: number;
  isActive: boolean;
}
