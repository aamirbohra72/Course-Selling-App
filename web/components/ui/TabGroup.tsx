"use client";

type Tab = { id: string; label: string };

type TabGroupProps = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function TabGroup({ tabs, activeId, onChange, className = "" }: TabGroupProps) {
  return (
    <div className={`inline-flex gap-1 rounded-xl bg-transparent p-0 ${className}`}>
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-[#001c55] text-white shadow-sm"
                : "border border-slate-200 bg-white text-[#001c55] hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
