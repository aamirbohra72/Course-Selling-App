"use client";

import { useToast } from "@/components/providers/ToastProvider";
import { userLogin, userSignup } from "@/lib/api";
import { getUserToken, setUserSession, takePendingCheckout } from "@/lib/session";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect } from "react";

export function AccountView() {
  const router = useRouter();
  const params = useSearchParams();
  const showToast = useToast();
  const nextParam = params.get("next");

  useEffect(() => {
    if (getUserToken()) router.replace(nextParam && nextParam.startsWith("/") ? nextParam : "/profile");
  }, [router, nextParam]);

  function postAuthRedirect() {
    if (nextParam && nextParam.startsWith("/")) {
      takePendingCheckout();
      router.push(nextParam);
      return;
    }
    const pending = takePendingCheckout();
    router.push(pending ? `/checkout/${pending}` : "/profile");
  }

  async function onSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    };
    const data = await userSignup(body);
    if (!data) {
      showToast("Signup failed.", true);
      return;
    }
    setUserSession(data.user, data.token);
    showToast("Account created.");
    postAuthRedirect();
  }

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    };
    const data = await userLogin(body);
    if (!data) {
      showToast("Login failed.", true);
      return;
    }
    setUserSession(data.user, data.token);
    showToast("Welcome back.");
    postAuthRedirect();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-[#001c55]">Student account</h1>
      <p className="mt-1 text-slate-500">Create an account or sign in to purchase courses.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#001c55]">Sign up</h2>
          <form onSubmit={onSignup} className="mt-4 flex flex-col gap-3">
            <label className="text-sm text-slate-600">
              Name
              <input name="name" required autoComplete="name" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-600">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-slate-600">
              Password
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <button type="submit" className="mt-2 rounded-xl bg-[#001c55] py-2.5 text-sm font-semibold text-white">
              Create account
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#001c55]">Sign in</h2>
          <form onSubmit={onLogin} className="mt-4 flex flex-col gap-3">
            <label className="text-sm text-slate-600">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-slate-600">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <button type="submit" className="mt-2 rounded-xl bg-[#001c55] py-2.5 text-sm font-semibold text-white">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
