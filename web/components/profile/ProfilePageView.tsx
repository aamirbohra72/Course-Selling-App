"use client";

import { PurchasedCourseCard } from "@/components/profile/PurchasedCourseCard";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TabGroup } from "@/components/ui/TabGroup";
import { fetchPurchases } from "@/lib/api";
import { getUserToken } from "@/lib/session";
import type { PurchaseRow } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { id: "courses", label: "Courses" },
  { id: "merch", label: "Merch" },
];

export function ProfilePageView() {
  const router = useRouter();
  const [tab, setTab] = useState("courses");
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [phase, setPhase] = useState<"loading" | "redirect" | "ready">("loading");

  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      router.replace("/account?next=/profile");
      setPhase("redirect");
      return;
    }
    let cancelled = false;
    (async () => {
      const rows = await fetchPurchases(token);
      if (!cancelled) {
        setPurchases(rows);
        setPhase("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (phase !== "ready") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-500 sm:px-6">
        {phase === "redirect" ? "Redirecting…" : "Loading…"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[#001c55]">Profile</h1>
        <p className="mt-1 text-slate-500">Manage security settings and your purchases.</p>
      </header>

      <SecurityCard />

      <section className="mt-12">
        <SectionHeading title="Purchases" />
        <div className="mt-4">
          <TabGroup tabs={TABS} activeId={tab} onChange={setTab} />
        </div>

        <div className="mt-6">
          {tab === "courses" ? (
            purchases.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
                No purchases yet. Browse the{" "}
                <Link href="/courses" className="font-semibold text-[#001c55] underline">
                  catalog
                </Link>
                .
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {purchases.map((row) => (
                  <PurchasedCourseCard key={row.purchaseId} row={row} />
                ))}
              </div>
            )
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500">
              No merch in this demo store.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
