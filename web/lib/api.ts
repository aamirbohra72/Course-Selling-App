import { API_URL } from "./config";
import type { Course, PurchaseRow, User } from "./types";

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const { token, headers: h, ...rest } = opts;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...h,
  };
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const res = await fetch(url, { ...rest, headers });
  const data = (await parseJson(res)) as T | null;
  return { ok: res.ok, status: res.status, data };
}

export async function fetchCourses(): Promise<Course[]> {
  const { ok, data } = await api<{ courses: Course[] }>("/api/users/courses");
  if (!ok || !data?.courses) return [];
  return data.courses;
}

export async function fetchCourse(courseId: string): Promise<Course | null> {
  const { ok, data } = await api<{ course: Course }>(`/api/users/courses/${courseId}`);
  if (!ok || !data?.course) return null;
  return data.course;
}

export async function fetchCourseAccess(token: string): Promise<Set<string>> {
  const { ok, data } = await api<{ courseIds: string[] }>("/api/users/me/course-access", {
    token,
  });
  if (!ok || !data?.courseIds) return new Set();
  return new Set(data.courseIds);
}

export async function fetchPurchases(token: string): Promise<PurchaseRow[]> {
  const { ok, data } = await api<{ purchases: PurchaseRow[] }>("/api/users/me/purchases", {
    token,
  });
  if (!ok || !data?.purchases) return [];
  return data.purchases;
}

export async function purchaseCourse(token: string, courseId: string): Promise<boolean> {
  const { ok } = await api(`/api/users/courses/${courseId}/purchase`, {
    method: "POST",
    token,
  });
  return ok;
}

export async function userSignup(body: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User; token: string } | null> {
  const { ok, data } = await api<{ user: User; token: string }>("/api/users/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!ok || !data?.token || !data.user) return null;
  return data;
}

export async function userLogin(body: {
  email: string;
  password: string;
}): Promise<{ user: User; token: string } | null> {
  const { ok, data } = await api<{ user: User; token: string }>("/api/users/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!ok || !data?.token || !data.user) return null;
  return data;
}
