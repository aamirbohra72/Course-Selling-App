"use client";

import { CourseSummaryCard } from "@/components/courses/CourseSummaryCard";
import { CheckoutPriceBreakdown } from "@/components/checkout/CheckoutPriceBreakdown";
import { CurrencySelect } from "@/components/ui/CurrencySelect";
import { SecureCheckoutBadge } from "@/components/ui/SecureCheckoutBadge";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { fetchCourse, fetchCourseAccess, purchaseCourse } from "@/lib/api";
import { discountForCoupon, usdCentsToCheckoutSubtotal } from "@/lib/pricing";
import { getUserToken, setPendingCheckout, takePendingCheckout } from "@/lib/session";
import type { Course } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CheckoutViewProps = {
  courseId: string;
};

export function CheckoutView({ courseId }: CheckoutViewProps) {
  const router = useRouter();
  const { currency, setCurrency } = usePreferences();
  const showToast = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [owned, setOwned] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState(false);
  const [buying, setBuying] = useState(false);
  const couponDetailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getUserToken();
      if (!token) {
        setPendingCheckout(courseId);
        showToast("Sign in to continue to checkout.", true);
        router.replace(`/account?next=/checkout/${courseId}`);
        return;
      }
      takePendingCheckout();
      const c = await fetchCourse(courseId);
      if (cancelled) return;
      if (!c) {
        showToast("Course not found.", true);
        router.replace("/courses");
        return;
      }
      setCourse(c);
      const access = await fetchCourseAccess(token);
      if (cancelled) return;
      if (access.has(courseId)) {
        setOwned(true);
        showToast("You already own this course.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, router, showToast]);

  const subtotal = course ? usdCentsToCheckoutSubtotal(course.priceCents, currency) : 0;
  let discount = 0;
  if (appliedCoupon && course) {
    const d = discountForCoupon(subtotal, currency, appliedCoupon);
    discount = d ?? 0;
  }
  const total = Math.max(0, subtotal - discount);

  function applyCoupon() {
    if (!course) return;
    const raw = couponInput.trim();
    const sub = usdCentsToCheckoutSubtotal(course.priceCents, currency);
    if (!raw) {
      setAppliedCoupon(null);
      setCouponError(true);
      return;
    }
    const d = discountForCoupon(sub, currency, raw);
    if (d === null) {
      setAppliedCoupon(null);
      setCouponError(true);
    } else {
      setAppliedCoupon(raw.toUpperCase());
      setCouponError(false);
    }
  }

  async function buyNow() {
    const token = getUserToken();
    if (!token || !course || owned) return;
    setBuying(true);
    const ok = await purchaseCourse(token, course.id);
    setBuying(false);
    if (!ok) {
      showToast("Purchase failed.", true);
      return;
    }
    showToast("Purchase complete.");
    router.push("/profile");
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-500 sm:px-6">
        Loading checkout…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="mb-4">
        <Link href="/courses" className="text-sm font-semibold text-[#001c55] hover:underline">
          ← Back to courses
        </Link>
      </p>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#001c55]">Checkout</h1>
        <SecureCheckoutBadge />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CourseSummaryCard course={course} />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#001c55]">Purchase Details</h2>

          <CurrencySelect
            className="mt-4"
            label="Payment currency"
            value={currency}
            onChange={setCurrency}
          />

          <div className="mt-5">
            <p className="text-sm font-semibold text-[#001c55]">Coupon code</p>
            <div className="mt-1 flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Apply Coupon Code"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="shrink-0 rounded-xl bg-[#001c55] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2a6b]"
              >
                Apply
              </button>
            </div>
            {couponError ? (
              <p className="mt-2 text-sm font-medium text-red-600">Invalid coupon applied</p>
            ) : null}
            <details ref={couponDetailsRef} className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-[#001c55]">Available Coupons</summary>
              <p className="mt-2 text-xs text-slate-500">
                <strong>SAVE10</strong> · <strong>WELCOME500</strong>
              </p>
            </details>
          </div>

          <CheckoutPriceBreakdown
            className="mt-5"
            subtotal={subtotal}
            discount={discount}
            total={total}
            currency={currency}
            onShowCoupons={() => {
              if (couponDetailsRef.current) couponDetailsRef.current.open = true;
            }}
          />

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={owned || buying}
              onClick={buyNow}
              className="w-full rounded-xl bg-[#001c55] py-3 text-sm font-semibold text-white hover:bg-[#0a2a6b] disabled:opacity-50"
            >
              {owned ? "Already enrolled" : buying ? "Processing…" : "Buy Now"}
            </button>
            <button
              type="button"
              onClick={() => showToast("Crypto checkout is not connected in this demo.", true)}
              className="w-full rounded-xl bg-[#001c55] py-3 text-sm font-semibold text-white hover:bg-[#0a2a6b]"
            >
              Pay via Crypto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
