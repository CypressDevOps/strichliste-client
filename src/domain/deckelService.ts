import { useState } from "react";
import { DeckelUIState } from "./models";

export const useDeckelState = () => {
  const [deckelList, setDeckelList] = useState<DeckelUIState[]>([]);

  // Neuen Deckel anlegen
  const addDeckel = (name: string) => {
  const newDeckel: DeckelUIState = {
    id: crypto.randomUUID(),
    name,
    status: "OFFEN",
    isSelected: true,   // <-- automatisch ausgewählt
    isActive: true,     // <-- automatisch aktiv
    lastActivity: new Date(),
  };
  setDeckelList(prev => [newDeckel, ...prev.map(d => ({ ...d, isActive: false, isSelected: false }))]);
};


  // Deckel auswählen / aktivieren
  const selectDeckel = (id: string) => {
    setDeckelList(prev =>
      prev.map(d => ({
        ...d,
        isSelected: d.id === id,
        isActive: d.id === id && d.status === "OFFEN",
      }))
    );
  };

  // Sortierte Deckel-Liste
  const getSortedDeckel = (): DeckelUIState[] => {
    return [...deckelList].sort((a, b) => {
      // Reihenfolge: Aktiv → Offen → Bezahlt → Historisch
      const statusOrder = { OFFEN: 1, BEZAHLT: 2, HISTORISCH: 3 } as const;

      // Aktiv wird nach vorne gesetzt
      const aVal = a.isActive ? 0 : statusOrder[a.status];
      const bVal = b.isActive ? 0 : statusOrder[b.status];

      // Innerhalb Status: zuletzt aktiv zuerst
      return aVal - bVal || b.lastActivity.getTime() - a.lastActivity.getTime();
    });
  };

  return { deckelList, addDeckel, selectDeckel, setDeckelList, getSortedDeckel };
};
