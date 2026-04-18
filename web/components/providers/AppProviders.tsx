"use client";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PreferencesProvider } from "./PreferencesProvider";
import { ToastProvider } from "./ToastProvider";
import { Suspense } from "react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <Suspense fallback={<div className="h-14 border-b border-slate-200 bg-white" />}>
          <SiteHeader />
        </Suspense>
        <main className="min-h-[calc(100vh-8rem)] bg-[#f8f9ff]">{children}</main>
        <SiteFooter />
      </ToastProvider>
    </PreferencesProvider>
  );
}
