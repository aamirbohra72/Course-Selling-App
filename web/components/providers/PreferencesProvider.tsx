"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DisplayCurrency } from "@/lib/pricing";

type PreferencesContextValue = {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const STORAGE_KEY = "displayCurrency";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("INR");

  useEffect(() => {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v === "USD" || v === "INR") setCurrencyState(v);
  }, []);

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    sessionStorage.setItem(STORAGE_KEY, c);
  }, []);

  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
