"use client";

import { MarketCourseCard } from "@/components/courses/MarketCourseCard";
import { useCourseCatalog } from "@/lib/hooks/useCourseCatalog";

type CourseCatalogProps = {
  searchQuery: string;
};

export function CourseCatalog({ searchQuery }: CourseCatalogProps) {
  const { courses, filtered, access } = useCourseCatalog(searchQuery);

  if (filtered.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
        {courses.length === 0
          ? "No courses yet. Publish from the admin console on the API server."
          : "No courses match your search."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {filtered.map((c) => (
        <MarketCourseCard key={c.id} course={c} owned={access.has(c.id)} />
      ))}
    </div>
  );
}
