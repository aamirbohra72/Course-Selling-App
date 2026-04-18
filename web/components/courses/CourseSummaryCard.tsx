import { BootcampPreviewCard } from "@/components/marketing/BootcampPreviewCard";
import type { Course } from "@/lib/types";

function buildMeta(description: string) {
  const t = description.trim();
  if (!t) return "Web dev (Every Friday)\nDevops (Every Friday)";
  const parts = t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}\n${parts[1]}`;
  const sentences = t.split(/(?<=[.!?])\s+/);
  if (sentences.length >= 2) return `${sentences[0]}\n${sentences[1]}`;
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

type CourseSummaryCardProps = {
  course: Course;
  className?: string;
};

export function CourseSummaryCard({ course, className = "" }: CourseSummaryCardProps) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="min-h-[220px] overflow-hidden rounded-t-2xl">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.imageUrl} alt="" className="h-full min-h-[220px] w-full object-cover" loading="lazy" />
        ) : (
          <BootcampPreviewCard
            compact
            className="min-h-[220px] rounded-none border-0 shadow-none"
          />
        )}
      </div>
      <div className="p-5">
        <h2 className="text-xl font-bold text-[#001c55]">{course.title}</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-500">{buildMeta(course.description)}</p>
      </div>
    </div>
  );
}
