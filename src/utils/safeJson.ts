export type SafeJsonOptions = {
  label?: string;
  storageKey?: string;
};

export function safeJsonParse<T>(raw: string | null, fallback: T, options?: SafeJsonOptions): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const label = options?.label ?? 'JSON';
    console.error(`Failed to parse ${label}`, error);

    if (options?.storageKey) {
      try {
        localStorage.removeItem(options.storageKey);
        console.warn(`Cleared corrupted storage key: ${options.storageKey}`);
      } catch (storageError) {
        console.error('Failed to clear corrupted storage key', storageError);
      }
    }

    return fallback;
  }
}
