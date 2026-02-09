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
  date: Date | string;
  description: string;
  count: number;
  sum: number;
  id?: string;
}

export interface DeckelUIState {
  id: string;
  name: string;
  status: DeckelStatus;
  isSelected: boolean;
  isActive: boolean;
  lastActivity: Date;
  transactions?: Transaction[];
}
