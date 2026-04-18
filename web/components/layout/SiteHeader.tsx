"use client";

import { IconSearch } from "@/components/ui/icons";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import type { DisplayCurrency } from "@/lib/pricing";
import { getUser } from "@/lib/session";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function searchValueForPath(pathname: string, q: string | null) {
  if (pathname === "/" || pathname === "/courses") return q ?? "";
  return "";
}

function setSearchRoute(router: ReturnType<typeof useRouter>, pathname: string, raw: string) {
  const t = raw.trim();
  const suffix = t ? `?q=${encodeURIComponent(t)}` : "";
  if (pathname === "/") router.replace(suffix ? `/${suffix}` : "/");
  else if (pathname === "/courses") router.replace(suffix ? `/courses${suffix}` : "/courses");
  else router.push(suffix ? `/courses${suffix}` : "/courses");
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, setCurrency } = usePreferences();
  const [letter, setLetter] = useState("A");

  const qParam = searchParams.get("q");
  const inputValue = searchValueForPath(pathname, qParam);

  useEffect(() => {
    const u = getUser();
    setLetter(u?.name?.trim()?.charAt(0).toUpperCase() || "A");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight">
          <span className="text-slate-900">100x</span>
          <span className="text-[#001c55]">Devs</span>
        </Link>

        <nav className="order-3 flex w-full justify-center gap-1 sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
          <Link
            href="/"
            className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-[#001c55]/10 text-[#001c55]"
                : "text-slate-500 hover:bg-slate-100 hover:text-[#001c55]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/courses"
            className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/courses"
                ? "bg-[#001c55]/10 text-[#001c55]"
                : "text-slate-500 hover:bg-slate-100 hover:text-[#001c55]"
            }`}
          >
            Courses
          </Link>
          <Link
            href="/profile"
            className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/profile"
                ? "bg-[#001c55]/10 text-[#001c55]"
                : "text-slate-500 hover:bg-slate-100 hover:text-[#001c55]"
            }`}
          >
            Store
          </Link>
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-slate-400">
              <IconSearch className="h-[18px] w-[18px]" />
            </span>
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setSearchRoute(router, pathname, e.target.value)}
              placeholder="Type to search"
              className="w-[min(220px,42vw)] rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Search courses"
            />
          </label>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as DisplayCurrency)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-[#001c55]"
            aria-label="Display currency"
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>

          <Link
            href="/account"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#001c55] hover:border-slate-300"
          >
            Account
          </Link>
          <Link
            href="/admin"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-[#001c55]"
          >
            Admin
          </Link>

          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white"
            title="Profile"
          >
            {letter}
          </span>
        </div>
      </div>
    </header>
  );
}
