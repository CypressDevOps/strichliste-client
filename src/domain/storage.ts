import { DeckelUIState } from './models';

const SESSION_MARKER_KEY = 'app_session_active';
const STORAGE_KEY = 'deckel_state_v1';

/**
 * Prüft ob Browser neu gestartet wurde (keine aktive Session)
 * Bei Refresh bleibt sessionStorage erhalten, nach Browser-Schließung ist es leer
 */
const isNewBrowserSession = (): boolean => {
  const hasSession = sessionStorage.getItem(SESSION_MARKER_KEY);
  if (!hasSession) {
    // Keine Session gefunden = Browser wurde neu gestartet
    sessionStorage.setItem(SESSION_MARKER_KEY, 'true');
    return true;
  }
  return false;
};

// src/domain/storage.ts (oder in deckelService.ts)
export const loadFromStorage = (): DeckelUIState[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    let deckelList: DeckelUIState[] = [];
    // falls Struktur { deckelList: [...] }
    if (Array.isArray(parsed?.deckelList)) deckelList = parsed.deckelList;
    else if (Array.isArray(parsed)) deckelList = parsed;
    else return [];

    // Bei neuem Browser-Start: Bezahlte Deckel entfernen
    if (isNewBrowserSession()) {
      const filteredList = deckelList.filter((d) => d.status !== 'BEZAHLT');

      // Speichere gefilterte Liste zurück
      if (filteredList.length !== deckelList.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredList));
      }

      return filteredList;
    }

    return deckelList;
  } catch {
    return [];
  }
};
