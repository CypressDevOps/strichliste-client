// Status eines Deckels
export type DeckelStatus = "OFFEN" | "BEZAHLT" | "HISTORISCH";

// Interface für einen Deckel im UI-State
export interface DeckelUIState {
  id: string;               // Eindeutige ID
  name: string;             // Name des Gasts oder Tischnummer
  status: DeckelStatus;     // OFFEN, BEZAHLT oder HISTORISCH
  isSelected: boolean;      // Details werden rechts angezeigt
  isActive: boolean;        // Nur true bei OFFEN + ausgewählt
  lastActivity: Date;       // Zuletzt aktiv
}