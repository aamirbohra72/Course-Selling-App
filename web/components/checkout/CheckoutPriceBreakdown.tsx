"use client";

import type { DisplayCurrency } from "@/lib/pricing";
import { formatCheckoutAmount } from "@/lib/pricing";

type CheckoutPriceBreakdownProps = {
  subtotal: number;
  discount: number;
  total: number;
  currency: DisplayCurrency;
  onShowCoupons: () => void;
  className?: string;
};

export function CheckoutPriceBreakdown({
  subtotal,
  discount,
  total,
  currency,
  onShowCoupons,
  className = "",
}: CheckoutPriceBreakdownProps) {
  return (
    <div className={`space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm ${className}`}>
      <div className="flex justify-between gap-4 text-slate-600">
        <span>Price (Including GST)</span>
        <span className="font-medium text-slate-900">{formatCheckoutAmount(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between gap-4 text-slate-600">
        <span>
          Net Discount{" "}
          <button
            type="button"
            className="text-xs font-semibold text-blue-600 underline"
            onClick={onShowCoupons}
          >
            Show Coupons
          </button>
        </span>
        <span className="font-medium text-slate-900">{formatCheckoutAmount(discount, currency)}</span>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-[#001c55]">
        <span>Total</span>
        <span>{formatCheckoutAmount(total, currency)}</span>
      </div>
    </div>
  );
}
