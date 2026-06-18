export function formatPrice(cents: number, currency: string, locale: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// L'API renvoie les prix en euros sous forme de chaîne décimale ("39.90").
export function formatEuro(price: string | null | undefined, locale: string): string {
  const amount = Number(price);
  if (!price || Number.isNaN(amount)) return "-";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(amount);
  } catch {
    return `${amount.toFixed(2)} €`;
  }
}
