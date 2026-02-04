// src/utils/nameUtils.ts

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

/*
  Split mit Erhalt der Trenner:
  Wir teilen in Sequenzen von "Token" und "Separator" und verarbeiten nur die Token-Teile.
  Trenner bleiben exakt wie im Original (z. B. " & ", ", ", " und ", " ").
*/
const tokenSeparatorRegex = /(\s*&\s*|\s*,\s*|\s+und\s+|\s+)/i;

// Formatiert zusammengesetzte Namen, z. B. "Maria & Nico" -> "Marias & Nicos"
// optionaler suffixText z. B. " Deckel"
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
    // Prüfe: folgt ein reines Leerzeichen (oder whitespace-separator) und danach ein reines Zahlen-Token?
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
