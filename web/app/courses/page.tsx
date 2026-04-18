import { CoursesPage } from "@/components/catalog/CoursesPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="py-16 text-center text-slate-500">Loading courses…</div>}
    >
      <CoursesPage />
    </Suspense>
  );
}
