// @ts-nocheck
export const formatPHP = (amount: number | null | undefined) => {
  if (amount == null) return '₱0.00';
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};