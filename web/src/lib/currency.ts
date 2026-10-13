export type Currency = "ZMW" | "USD";

/** Indicative mock rate. Replace with a live FX feed when the payments API is connected. */
export const RATES: Record<Currency, number> = { ZMW: 1, USD: 1 / 26.5 };

export const CURRENCY_LABEL: Record<Currency, string> = {
  ZMW: "ZMW, Zambian kwacha (K)",
  USD: "USD, US dollar ($)",
};

export function formatMoney(zmw: number, currency: Currency): string {
  const v = zmw * RATES[currency];
  if (currency === "ZMW") return `K ${Math.round(v).toLocaleString("en-GB")}`;
  return `$${v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(2)}`;
}
