type BootcampPreviewCardProps = {
  className?: string;
  compact?: boolean;
};

/** Promotional gradient card matching 100x-style bootcamp artwork (no external assets). */
export function BootcampPreviewCard({ className = "", compact = false }: BootcampPreviewCardProps) {
  const pad = compact ? "p-4" : "p-5";
  const textSize = compact ? "text-[10px]" : "text-[11px]";
  const bleed = compact ? "-mx-4 -mb-4 px-4" : "-mx-5 -mb-5 px-5";
  return (
    <div
      className={`w-full overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-700 via-[#001c55] to-slate-800 text-slate-100 shadow-xl ${pad} ${className}`}
      aria-hidden
    >
      <div className={`mb-3 flex flex-wrap gap-2 ${compact ? "mb-2" : ""}`}>
        <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Web3
        </span>
        <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
          Bootcamp 1.0
        </span>
        <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          AI
        </span>
      </div>
      <div className={`grid grid-cols-2 gap-2 ${textSize}`}>
        <ul className="list-disc space-y-0.5 pl-4 opacity-95">
          <li>Solana Runtime</li>
          <li>Rust & Anchor</li>
          {!compact ? <li>Classical ML</li> : <li>Web2 + Web3</li>}
        </ul>
        <ul className="list-disc space-y-0.5 pl-4 opacity-95">
          <li>GenAI</li>
          <li>DevOps</li>
          {!compact ? <li>Production deploys</li> : <li>System design</li>}
        </ul>
      </div>
      <div className={`rounded-2xl bg-white p-3 text-[#001c55] ${compact ? "mt-3 p-2.5" : "mt-4"}`}>
        <p className={`font-bold ${compact ? "text-sm" : ""}`}>Web dev + Devops</p>
        <p className="text-xs text-slate-500">Complete TypeScript + MERN stack</p>
      </div>
      <div
        className={`${bleed} mt-3 flex items-center gap-3 bg-[#001c55]/50 py-3 ${compact ? "mt-2 py-2.5" : "mt-4"}`}
      >
        <div className="h-9 w-9 shrink-0 rounded-full border-2 border-white/40 bg-gradient-to-br from-slate-400 to-slate-600" />
        <div>
          <p className="text-xs font-semibold text-white sm:text-sm">Your instructor</p>
          <p className="text-[10px] text-slate-200 sm:text-[11px]">Senior Engineer & Mentor</p>
        </div>
      </div>
    </div>
  );
}
