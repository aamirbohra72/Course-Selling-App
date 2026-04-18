"use client";

import type { DisplayCurrency } from "@/lib/pricing";

type CurrencySelectProps = {
  id?: string;
  value: DisplayCurrency;
  onChange: (c: DisplayCurrency) => void;
  label: string;
  className?: string;
};

export function CurrencySelect({ id, value, onChange, label, className = "" }: CurrencySelectProps) {
  return (
    <label className={`block text-sm font-semibold text-[#001c55] ${className}`}>
      {label}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as DisplayCurrency)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
      >
        <option value="INR">INR</option>
        <option value="USD">USD</option>
      </select>
    </label>
  );
}
