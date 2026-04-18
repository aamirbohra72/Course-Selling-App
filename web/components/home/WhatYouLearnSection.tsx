import { BootcampPreviewCard } from "@/components/marketing/BootcampPreviewCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function WhatYouLearnSection() {
  return (
    <section className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-start">
      <div>
        <SectionHeading
          title="What You’ll Learn"
          subtitle="Master server side development, APIs, and cloud infrastructure."
        />
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Build production-grade backends, design resilient APIs, and ship to the cloud with CI/CD. You’ll work through
          real projects that mirror how strong teams ship software end-to-end.
        </p>
      </div>
      <div className="flex justify-center lg:justify-end">
        <div className="w-full max-w-md">
          <BootcampPreviewCard compact />
        </div>
      </div>
    </section>
  );
}
