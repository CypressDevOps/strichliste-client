// src/utils/nameUtils.ts
import type { DeckelUIState } from '../domain/models'; // Pfad anpassen falls nötig

// Prüft, ob ein Token mit einer Zahl endet
const endsWithNumber = (name: string): boolean => {
  return /\d$/.test(name.trim());
};

// Regel: wann ein Apostroph statt s verwendet werden soll
export const needsApostrophe = (name: string): boolean => {
  const lower = name.trim().toLowerCase();
  return /ss$|ß$|tz$|ce$|s$|z$|x$/.test(lower);
};

// Formatiert einen einzelnen Namen (keine Änderung, wenn Token mit Zahl endet)
export const formatSinglePossessive = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  // Wenn Token mit Zahl endet, nichts anhängen
  if (endsWithNumber(trimmed)) return trimmed;
  return needsApostrophe(trimmed) ? `${trimmed}'` : `${trimmed}s`;
};

// src/utils/nameUtils.ts
export const displayNameFromStored = (storedName: string): string => {
  if (!storedName) return storedName;
  let s = storedName.trim();
  // defensive cleanup: multiple "Deckel" strings
  // "Jannis Deckel Deckel" -> "Jannis Deckel"
  while (s.match(/\bDeckel\s+Deckel\b/i)) {
    s = s.replace(/\bDeckel\s+Deckel\b/i, 'Deckel');
  }
  // "Jannis' Deckels Deckel" -> "Jannis Deckel"
  s = s.replace(/'s?\s*Deckels?\s*Deckel\b/gi, ' Deckel');
  // normalize trailing whitespace before Deckel
  s = s.replace(/\s+Deckel\s*$/i, ' Deckel');
  return s.trim();
};

// Split mit Erhalt der Trenner
const tokenSeparatorRegex = /(\s*&\s*|\s*,\s*|\s+und\s+|\s+)/i;

// Formatiert zusammengesetzte Namen, z. B. "Maria & Nico" -> "Marias & Nicos"
export const formatPossessiveCompound = (raw: string, suffixText = ' Deckel'): string => {
  if (!raw) return suffixText.trim() ? suffixText : '';

  // Zerlege in Token und Separatoren, z.B. ["Maria", " & ", "Nico"] oder ["Tisch", " ", "5"]
  const parts = raw.split(tokenSeparatorRegex).filter((p) => p !== undefined && p !== '');

  const formattedParts: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Wenn Teil ein Separator ist, belasse ihn unverändert
    if (tokenSeparatorRegex.test(part)) {
      formattedParts.push(part);
      continue;
    }

    // part ist ein Token (z. B. "Tisch", "5", "Maria")
    const nextSep = parts[i + 1];
    const nextToken = parts[i + 2];

    const nextIsWhitespaceSeparator = typeof nextSep === 'string' && /^\s+$/.test(nextSep);
    const nextIsNumericToken = typeof nextToken === 'string' && /^\d+$/.test(nextToken.trim());

    // Wenn direkt nach diesem Token ein Leerzeichen kommt und danach eine Zahl,
    // dann füge kein Possessiv-Suffix an dieses Token an.
    if (nextIsWhitespaceSeparator && nextIsNumericToken) {
      formattedParts.push(part);
      continue;
    }

    // Sonst normal formatieren
    formattedParts.push(formatSinglePossessive(part));
  }

  const joined = formattedParts.join('');
  return `${joined}${suffixText}`;
};

// Entfernt eine trailing number (z. B. "Jannis Deckel 2" -> "Jannis Deckel")
export const stripTrailingNumber = (name: string): string => {
  return name.replace(/\s+\d+$/u, '').trim();
};

// Liefert die Root für Vergleiche:
// - entfernt trailing numbers
// - entfernt optional das Wort "deckel" für die Root-Ermittlung
export const getRootName = (name: string): string => {
  const cleaned = stripTrailingNumber(name).toLowerCase().trim();
  const deckelSuffix = ' deckel';
  if (cleaned.endsWith(deckelSuffix)) {
    return cleaned.slice(0, -deckelSuffix.length).trim() || 'deckel';
  }
  return cleaned;
};

// Prüft, ob zwei Namen zur selben Basis gehören.
// Behandelt "root", "root deckel", "root deckel N", "root N" als gleich.
export const isSameBaseName = (a: string, b: string): boolean => {
  const ra = getRootName(a);
  const rb = getRootName(b);
  return ra === rb;
};

// Normalisiert eine Nutzereingabe in die gewünschte "Deckel"-Form:
// "Janni" -> "Jannis Deckel", "Chris" -> "Chris Deckel", "Anna" -> "Annas Deckel"
// Wenn bereits "Deckel" im Namen ist, bleibt der Name unverändert.
export const toDeckelForm = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const lower = trimmed.toLowerCase();
  // Wenn bereits "deckel" im Namen vorkommt, entferne "deckel" für die Basis (wir arbeiten mit der Basis ohne "Deckel")
  if (lower.includes('deckel')) {
    return stripTrailingNumber(trimmed)
      .replace(/deckel/i, '')
      .trim();
  }

  // Zusammengesetzte Namen: formatiere die Tokens, aber gib nur die possessive Basis zurück (ohne " Deckel")
  if (tokenSeparatorRegex.test(trimmed) && trimmed.includes('&')) {
    const compound = formatPossessiveCompound(trimmed, ''); // liefert z.B. "Marias & Nicos"
    return compound.trim();
  }

  const endsWithS = /s$/i.test(trimmed);
  const nameWithS = endsWithS ? trimmed : `${trimmed}s`;
  return nameWithS;
};

/**
 * Erzeugt den nächsten Anzeige‑Namen:
 * - normalisiert Eingabe zuerst in Deckel-Form (toDeckelForm)
 * - zählt alle Einträge, deren Root mit dem neuen Root übereinstimmt
 * - wenn eingegebener Name auf "Deckel" endet, fügt Nummer nach "Deckel" ein
 * - wenn bereits Deckel-Formen existieren, bevorzugt "Root Deckel N"
 */
export const nextDisplayName = (baseName: string, list: DeckelUIState[]): string => {
  const baseTrimmed = stripTrailingNumber(baseName).trim();
  if (!baseTrimmed) return baseTrimmed;

  // Wenn baseName bereits "Deckel" enthält (z.B. aus alten Daten), entferne es für die Basis
  const baseWithoutDeckel = baseTrimmed.replace(/\bdeckel\b/i, '').trim();

  // Wir erwarten als input jetzt die Possessiv‑Basis (z.B. "Jannis" oder "Marias & Nicos")
  const possBase = baseWithoutDeckel;
  const root = getRootName(possBase); // root ohne "deckel" und ohne Zahl

  // Zähle vorhandene Einträge mit derselben Root
  const count = list
    .map((d) => getRootName(d.name))
    .filter((existingRoot) => existingRoot === root).length;

  // Wenn noch kein Eintrag existiert, gib "PossBase Deckel" zurück
  if (count === 0) {
    return `${possBase} Deckel`;
  }

  // Sonst: gib "PossBase Deckel N" zurück
  return `${possBase} Deckel ${count + 1}`;
};
