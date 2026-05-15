// Fallback rates vs USD used only when live fetch fails
const FALLBACK_RATES_VS_USD: Record<string, number> = {
  USD: 1, INR: 84, EUR: 0.92, GBP: 0.79,
  JPY: 157, AUD: 1.54, CAD: 1.37, SGD: 1.35,
};

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> = FALLBACK_RATES_VS_USD,
): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return Math.round((amount / fromRate) * toRate * 100) / 100;
}

export const SUPPORTED_CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)", locale: "en-IN" },
  { code: "USD", label: "US Dollar ($)", locale: "en-US" },
  { code: "EUR", label: "Euro (€)", locale: "de-DE" },
  { code: "GBP", label: "British Pound (£)", locale: "en-GB" },
  { code: "JPY", label: "Japanese Yen (¥)", locale: "ja-JP" },
  { code: "AUD", label: "Australian Dollar (A$)", locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar (C$)", locale: "en-CA" },
  { code: "SGD", label: "Singapore Dollar (S$)", locale: "en-SG" },
] as const;

const LOCALE_MAP: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.locale])
);

export function formatCurrency(amount: number | string, currency: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const locale = LOCALE_MAP[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function getCurrencySymbol(currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: 0 })
    .format(0)
    .replace(/[\d,.\s]/g, "")
    .trim();
}
