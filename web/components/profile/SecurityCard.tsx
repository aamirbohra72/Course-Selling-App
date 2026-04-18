"use client";

import { useToast } from "@/components/providers/ToastProvider";
import { IconLock } from "@/components/ui/icons";

export function SecurityCard() {
  const showToast = useToast();

  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight text-[#001c55]">Security</h2>
      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#001c55]">
            <IconLock className="h-[22px] w-[22px]" />
          </div>
          <div>
            <p className="font-bold text-[#001c55]">Change Password</p>
            <p className="text-sm text-slate-500">Update your password to keep your account secure.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => showToast("Password change is not available in this API yet.", true)}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#001c55] transition-colors hover:bg-slate-50"
        >
          Change Password
        </button>
      </div>
    </section>
  );
}
