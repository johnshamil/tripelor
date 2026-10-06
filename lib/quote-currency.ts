export type QuoteCurrency = "USD" | "MVR";

// BML's published USD selling rate. Keep the rate on each signed quote so its
// displayed MVR amounts remain stable for the quote's 48-hour lifetime.
export const MVR_PER_USD = 15.42;

export function quoteAmount(usdAmount: number, currency: QuoteCurrency, rate = MVR_PER_USD) {
  return currency === "MVR" ? Math.round(usdAmount * rate * 100) / 100 : usdAmount;
}

export function quoteMoney(usdAmount: number, currency: QuoteCurrency, rate = MVR_PER_USD) {
  const amount = quoteAmount(usdAmount, currency, rate);
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "MVR" ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}
