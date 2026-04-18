type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function SectionHeading({ title, subtitle, className = "" }: SectionHeadingProps) {
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold tracking-tight text-[#001c55]">{title}</h2>
      {subtitle ? <p className="mt-1 text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
