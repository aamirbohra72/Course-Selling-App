"use client";

import Link from "next/link";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { formatCatalogPrice } from "@/lib/pricing";
import type { Course } from "@/lib/types";

type MarketCourseCardProps = {
  course: Course;
  owned: boolean;
};

export function MarketCourseCard({ course, owned }: MarketCourseCardProps) {
  const { currency } = usePreferences();

  return (
    <article className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-[minmax(200px,320px)_1fr]">
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
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        {owned ? (
          <span className="w-fit rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            Owned
          </span>
        ) : null}
        <h3 className="text-xl font-bold text-[#001c55]">{course.title}</h3>
        <p className="line-clamp-4 text-sm text-slate-500">{course.description}</p>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-extrabold text-[#001c55]">
            {formatCatalogPrice(course.priceCents, currency)}
          </p>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-[#001c55]">
            {currency}
          </span>
        </div>
        <div className="mt-auto">
          {owned ? (
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-slate-200 py-3 text-sm font-semibold text-slate-500"
            >
              Purchased
            </button>
          ) : (
            <Link
              href={`/checkout/${course.id}`}
              className="flex w-full items-center justify-center rounded-xl bg-[#001c55] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a2a6b]"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
