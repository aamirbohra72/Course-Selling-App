import { BootcampPreviewCard } from "@/components/marketing/BootcampPreviewCard";

export function HeroSection() {
  return (
    <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#001c55] sm:text-4xl">
          100xSchool Combined Bootcamp
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Master real-world engineering skills from zero to production. Build scalable web apps, deploy on cloud
          infrastructure, and create blockchain applications with hands-on mentorship.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["Web3 Fundamentals", "Cloud Computing", "React & Node.js", "Full Stack Development"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#001c55] shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-center lg:justify-end">
        <div className="w-full max-w-md">
          <BootcampPreviewCard />
        </div>
      </div>
    </section>
  );
}
