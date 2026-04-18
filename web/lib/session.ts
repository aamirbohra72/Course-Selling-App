import type { User } from "./types";

const USER_KEY = "user";
const TOKEN_KEY = "userToken";
const PENDING_CHECKOUT_KEY = "pendingCheckoutCourseId";

export function getUserToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setUserSession(user: User, token: string) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearUserSession() {
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function setPendingCheckout(courseId: string) {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, courseId);
}

export function takePendingCheckout(): string | null {
  if (typeof window === "undefined") return null;
  const id = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  if (id) sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  return id;
}

export function peekPendingCheckout(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_CHECKOUT_KEY);
}
