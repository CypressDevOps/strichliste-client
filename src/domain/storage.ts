import { DeckelUIState } from './models';

const STORAGE_KEY = 'deckel_state_v1';

// NOTE: isNewBrowserSession moved to deckelService.ts to avoid duplication

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

    return deckelList;
  } catch {
    return [];
  }
};
