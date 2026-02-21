import { DeckelUIState } from './models';
import { safeJsonParse } from '../utils/safeJson';

const STORAGE_KEY = 'deckel_state_v1';

// NOTE: isNewBrowserSession moved to deckelService.ts to avoid duplication

export const loadFromStorage = (): DeckelUIState[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = safeJsonParse(raw, [], {
      label: 'deckel_state_v1',
      storageKey: STORAGE_KEY,
    });

    let deckelList: DeckelUIState[] = [];
    // falls Struktur { deckelList: [...] }
    if (Array.isArray((parsed as { deckelList?: DeckelUIState[] })?.deckelList)) {
      deckelList = (parsed as { deckelList?: DeckelUIState[] }).deckelList ?? [];
    } else if (Array.isArray(parsed)) deckelList = parsed;
    else return [];

    return deckelList;
  } catch {
    return [];
  }
};
