// src/utils/format.ts

export const formatDate = (d?: Date | string): string => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString();
};

export const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace('.', ',') + ' €';
};
