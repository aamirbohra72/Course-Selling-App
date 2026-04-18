"use client";

import { CourseCatalog } from "@/components/catalog/CourseCatalog";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useSearchParams } from "next/navigation";

export function CoursesPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading
        title="Courses"
        subtitle="Browse cohorts and continue to checkout when you’re ready."
      />
      <div className="mt-8">
        <CourseCatalog searchQuery={q} />
      </div>
    </div>
  );
}
