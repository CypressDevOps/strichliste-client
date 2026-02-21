// src/domain/stockModels.ts
/**
 * Bestandsverwaltungs-Datenmodelle
 * Erweitert das bestehende Produktsystem mit Lagerverwaltung
 */

export interface ProductStock {
  product_id: string;
  quantity: number;
  unit: 'Stück' | 'Kasten' | 'Liter' | 'ml' | 'kg' | 'g'; // Einheit
  threshold_low?: number; // Niedriger Bestand Schwellenwert
  last_updated_by?: string; // Benutzer-ID
  last_updated_at: string; // ISO 8601
  // Verpackungseinheit für bessere Bestandsverwaltung
  packing_unit?: 'Einzelstück' | 'Kiste' | 'Karton' | 'Palette';
  units_per_pack?: number; // Stück pro Verpackung (z.B. 24 Flaschen pro Kiste)
  packing_breakdown?: PackingBreakdownEntry[];
}

export interface PackingBreakdownEntry {
  unit: 'Kiste' | 'Karton' | 'Palette';
  units_per_pack: number;
  packs: number;
}

export type StockActionType = 'set' | 'add' | 'subtract' | 'import' | 'manual' | 'correction';

export interface StockHistoryEntry {
  id: string;
  product_id: string;
  user_id?: string; // Benutzer der Änderung
  action_type: StockActionType;
  previous_value: number;
  new_value: number;
  change_amount?: number; // Nur bei add/subtract
  reason?: string; // Optionale Begründung
  source: 'manual' | 'import' | 'system'; // Quelle der Änderung
  import_session_id?: string; // Referenz zu Import-Session
  created_at: string; // ISO 8601
}

export interface StockImportSession {
  id: string;
  user_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  raw_image_path?: string; // Temporärer Pfad zum Bild
  created_at: string; // ISO 8601
  processed_at?: string;
  error_message?: string;
}

export interface OCRParseResult {
  product_name: string;
  recognized_quantity: number;
  recognized_sku?: string;
  recognized_price?: number;
  confidence: number; // 0-1
  raw_text: string;
}

export interface StockImportMatch {
  ocr_result: OCRParseResult;
  matched_product?: {
    product_id: string;
    name: string;
    match_type: 'sku_exact' | 'name_exact' | 'name_fuzzy' | 'none';
    match_score: number; // 0-1
  };
  action: {
    type: 'set' | 'add'; // Setzen oder Addieren
    value: number;
    unit: string;
  };
  is_confirmed?: boolean;
  manual_product_id?: string; // Falls manuell zugeordnet
  // Verpackungsinformationen
  packing_unit?: 'Einzelstück' | 'Kiste' | 'Karton' | 'Palette';
  units_per_pack?: number;
  packs_count?: number;
}

export interface StockImportBatch {
  session_id: string;
  matches: StockImportMatch[];
  summary: {
    total_items: number;
    matched_items: number;
    unmatched_items: number;
    success_rate: number; // 0-1
  };
}

// Filter für Bestandsübersicht
export interface StockFilter {
  search?: string; // Text-Suche (Name, SKU)
  category?: string;
  low_stock_only?: boolean;
  low_threshold?: number;
  sort_by?: 'name' | 'quantity' | 'last_updated';
  sort_order?: 'asc' | 'desc';
}

// Bulk Edit Operation
export interface BulkStockOperation {
  product_ids: string[];
  operation: 'set' | 'add' | 'subtract';
  value: number;
  reason?: string;
}
