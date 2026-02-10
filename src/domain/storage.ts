import { DeckelUIState } from './models';

// src/domain/storage.ts (oder in deckelService.ts)
export const loadFromStorage = (): DeckelUIState[] => {
  try {
    const raw = localStorage.getItem('deckel_state_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // falls Struktur { deckelList: [...] }
    if (Array.isArray(parsed?.deckelList)) return parsed.deckelList;
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
};
