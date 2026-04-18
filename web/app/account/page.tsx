import { AccountView } from "@/components/account/AccountView";
import { Suspense } from "react";

export default function AccountPage() {
  return (
    <Suspense
      fallback={<div className="py-16 text-center text-slate-500">Loading…</div>}
    >
      <AccountView />
    </Suspense>
  );
}
