import { IconLock } from "@/components/ui/icons";

export function SecureCheckoutBadge() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800"
      role="status"
    >
      <IconLock className="h-[18px] w-[18px] shrink-0" />
      Secure Checkout
    </div>
  );
}
