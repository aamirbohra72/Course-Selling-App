export const FX_INR_PER_USD = 83;

export type DisplayCurrency = "USD" | "INR";

export function usdCentsToCheckoutSubtotal(priceCents: number, currency: DisplayCurrency): number {
  if (currency === "INR") {
    return Math.round((priceCents / 100) * FX_INR_PER_USD);
  }
  return priceCents;
}

export function formatCheckoutAmount(displayUnits: number, currency: DisplayCurrency): string {
  if (currency === "INR") {
    return displayUnits.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  }
  return (displayUnits / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export function formatCatalogPrice(priceCents: number, currency: DisplayCurrency): string {
  const usd = priceCents / 100;
  if (currency === "INR") {
    const inr = usd * FX_INR_PER_USD;
    return inr.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  }
  return usd.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/** @returns discount in same units as subtotal, or null if invalid code */
export function discountForCoupon(
  subtotal: number,
  currency: DisplayCurrency,
  codeRaw: string,
): number | null {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return null;
  if (code === "SAVE10") return Math.round(subtotal * 0.1);
  if (code === "WELCOME500") {
    return Math.min(500, subtotal);
  }
  return null;
}
