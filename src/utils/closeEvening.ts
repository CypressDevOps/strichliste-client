// src/utils/closeEvening.ts
import { DECKEL_STATUS, DeckelUIState, DeckelStatus } from '../domain/models';

export type Change = { id: string; from: DeckelStatus; to: DeckelStatus };

const LAST_CLOSED_KEY = 'abend_last_closed_at_iso';

export function getTotalValue(deckel: DeckelUIState): number | null {
  const candidates = [
    'Gesamtergebnis',
    'gesamtergebnis',
    'gesamtErgebnis',
    'GesamtErgebnis',
    'gesamt',
    'total',
    'totalScore',
    'totalPoints',
    'score',
    'points',
    'result',
    'sum',
  ];

  const d = deckel as unknown as Record<string, unknown>;

  for (const key of candidates) {
    if (!(key in d)) continue;
    const v = d[key];
    if (v === undefined || v === null) continue;
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }

  const results = d['results'];
  if (results && typeof results === 'object') {
    const rObj = results as Record<string, unknown>;
    const nestedCandidates = ['total', 'score', 'points', 'result', 'sum'];
    for (const nk of nestedCandidates) {
      if (!(nk in rObj)) continue;
      const rv = rObj[nk];
      if (rv === undefined || rv === null) continue;
      if (typeof rv === 'number' && !Number.isNaN(rv)) return rv;
      if (typeof rv === 'string') {
        const n = Number(rv);
        if (!Number.isNaN(n)) return n;
      }
    }
  }

  return null;
}

export function canCloseEveningNow(): boolean {
  try {
    const iso = localStorage.getItem(LAST_CLOSED_KEY);
    if (!iso) return true;
    const last = new Date(iso);
    const now = new Date();
    const nextAllowed = new Date(last);
    nextAllowed.setDate(last.getDate() + 1);
    nextAllowed.setHours(5, 0, 0, 0);
    return now >= nextAllowed;
  } catch {
    return true;
  }
}

/**
 * Berechnet die notwendigen Status-Änderungen beim "Abend abschließen".
 * Liefert ein Array von { id, from, to } zurück.
 * Setzt den LAST_CLOSED_KEY nur, wenn tatsächlich Änderungen vorgenommen wurden
 * (Parent sollte die Änderungen an den Server senden).
 */
export function closeEvening(deckelList: DeckelUIState[]): Change[] {
  const changes: Change[] = [];

  for (const d of deckelList) {
    const current = d.status;
    let target: DeckelStatus = current;

    const total = getTotalValue(d);

    if (total !== null && total === 0) {
      target = DECKEL_STATUS.BEZAHLT;
    } else {
      if (current !== DECKEL_STATUS.BEZAHLT) {
        target = DECKEL_STATUS.GONE;
      }
    }

    if (target !== current) {
      changes.push({ id: d.id, from: current, to: target });
    }
  }

  // Hinweis: wir setzen den Timestamp hier nicht; Parent setzt ihn nach erfolgreichem Server-Update.
  return changes;
}

/** Test helper */
export function resetCloseEveningLock(): void {
  try {
    localStorage.removeItem(LAST_CLOSED_KEY);
  } catch {
    // ignore
  }
}

/** Parent helper: setze Timestamp nach erfolgreichem Abschluss */
export function markEveningClosedNow(): void {
  try {
    localStorage.setItem(LAST_CLOSED_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}
