import { HomePage } from "@/components/home/HomePage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-slate-500">Loading…</div>}>
      <HomePage />
    </Suspense>
  );
}
