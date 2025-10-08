// Currency helpers

export function centsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function displayToCents(displayValue: string): number {
  const cleaned = displayValue.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(cleaned || '0') * 100);
}

export function formatCurrency(amount: number, currency?: string): string {
  const formatted = amount.toFixed(2);
  return currency ? `${formatted} ${currency}` : `$${formatted}`;
}

export function calculateTotal(amountNzd: number, feeNzd: number): number {
  return amountNzd + feeNzd;
}

export function calculateForeignAmount(amountNzd: number, rate: number): number {
  return amountNzd * rate;
}
