"use client";

import { fetchCourseAccess, fetchCourses } from "@/lib/api";
import { getUserToken } from "@/lib/session";
import type { Course } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

export function useCourseCatalog(searchQuery: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [access, setAccess] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchCourses();
      if (!cancelled) setCourses(list);
      const token = getUserToken();
      if (token) {
        const ids = await fetchCourseAccess(token);
        if (!cancelled) setAccess(ids);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => `${c.title} ${c.description}`.toLowerCase().includes(q));
  }, [courses, searchQuery]);

  return { courses, filtered, access };
}
