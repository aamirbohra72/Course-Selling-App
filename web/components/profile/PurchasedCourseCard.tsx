"use client";

import Link from "next/link";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { formatCatalogPrice } from "@/lib/pricing";
import type { PurchaseRow } from "@/lib/types";

type PurchasedCourseCardProps = {
  row: PurchaseRow;
};

export function PurchasedCourseCard({ row }: PurchasedCourseCardProps) {
  const { course } = row;
  const { currency } = usePreferences();
  const showToast = useToast();

  return (
    <article className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(240px,360px)_1fr]">
      <div className="min-h-[200px] bg-gradient-to-br from-cyan-700 to-[#001c55]">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.imageUrl}
            alt=""
            className="h-full min-h-[200px] w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-[#001c55] sm:text-xl">{course.title}</h3>
          <p className="mt-2 line-clamp-4 text-sm text-slate-500">{course.description}</p>
          <p className="mt-2 text-sm font-semibold text-[#001c55]">
            {formatCatalogPrice(course.priceCents, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Purchased {new Date(row.purchasedAt).toLocaleString()}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-xl bg-[#001c55] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a2a6b]"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => showToast("Invoices are not generated in this demo.", true)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#001c55] hover:bg-slate-50"
          >
            View Invoice
          </button>
          <button
            type="button"
            onClick={() => showToast("Certificates are not issued in this demo.", true)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#001c55] hover:bg-slate-50"
          >
            Download Certificate
          </button>
        </div>
      </div>
    </article>
  );
}
