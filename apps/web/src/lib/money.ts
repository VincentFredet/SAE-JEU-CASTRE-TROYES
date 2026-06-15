export function formatPrice(cents: number, currency: string, locale: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
