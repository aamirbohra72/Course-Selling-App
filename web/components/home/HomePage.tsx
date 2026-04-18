"use client";

import { CourseCatalog } from "@/components/catalog/CourseCatalog";
import { HeroSection } from "@/components/home/HeroSection";
import { WhatYouLearnSection } from "@/components/home/WhatYouLearnSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useSearchParams } from "next/navigation";

export function HomePage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <HeroSection />
      <WhatYouLearnSection />
      <div id="courses" className="mt-14 scroll-mt-24">
        <SectionHeading
          title="All courses"
          subtitle="Sign in from Account to purchase and unlock full access."
        />
        <div className="mt-6">
          <CourseCatalog searchQuery={q} />
        </div>
      </div>
    </div>
  );
}
