import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, courses, purchases } from "../db/schema.js";
import { signUserToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";
import { requireUser } from "../middleware/auth.js";
import { validateBody, parseUuidParam } from "../middleware/validate.js";
import {
  signupSchema,
  loginSchema,
} from "../validators/index.js";

const r = Router();

const BCRYPT_ROUNDS = 12;

r.post(
  "/signup",
  validateBody(signupSchema),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.validatedBody;
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      if (existing.length) {
        throw new AppError("Email already registered", 409);
      }
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const [row] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          passwordHash,
          name,
        })
        .returning({ id: users.id, email: users.email, name: users.name });
      const token = signUserToken({ userId: row.id });
      res.status(201).json({ user: row, token });
    } catch (e) {
      next(e);
    }
  },
);

r.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError("Invalid email or password", 401);
    }
    const token = signUserToken({ userId: user.id });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (e) {
    next(e);
  }
});

/** Public course catalog */
r.get("/courses", async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        priceCents: courses.priceCents,
        imageUrl: courses.imageUrl,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .orderBy(asc(courses.createdAt));
    res.json({ courses: rows });
  } catch (e) {
    next(e);
  }
});

/** Authenticated: single course + ownership flag */
r.get("/courses/:courseId", parseUuidParam("courseId"), async (req, res, next) => {
  try {
    const courseId = req.paramsParsed.courseId;
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        priceCents: courses.priceCents,
        imageUrl: courses.imageUrl,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!course) throw new AppError("Course not found", 404);
    res.json({ course });
  } catch (e) {
    next(e);
  }
});

r.get("/me/purchases", requireUser, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const rows = await db
      .select({
        purchaseId: purchases.id,
        purchasedAt: purchases.purchasedAt,
        course: {
          id: courses.id,
          title: courses.title,
          description: courses.description,
          priceCents: courses.priceCents,
          imageUrl: courses.imageUrl,
        },
      })
      .from(purchases)
      .innerJoin(courses, eq(purchases.courseId, courses.id))
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.purchasedAt));
    res.json({ purchases: rows });
  } catch (e) {
    next(e);
  }
});

r.post(
  "/courses/:courseId/purchase",
  requireUser,
  parseUuidParam("courseId"),
  async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const courseId = req.paramsParsed.courseId;
      const [course] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);
      if (!course) throw new AppError("Course not found", 404);

      const [existing] = await db
        .select({ id: purchases.id })
        .from(purchases)
        .where(
          and(eq(purchases.userId, userId), eq(purchases.courseId, courseId)),
        )
        .limit(1);
      if (existing) throw new AppError("Already purchased", 409);

      const [p] = await db
        .insert(purchases)
        .values({ userId, courseId })
        .returning({
          id: purchases.id,
          courseId: purchases.courseId,
          purchasedAt: purchases.purchasedAt,
        });
      res.status(201).json({ purchase: p });
    } catch (e) {
      if (e?.code === "23505") {
        return next(new AppError("Already purchased", 409));
      }
      next(e);
    }
  },
);

/** Which courses this user owns (ids) — useful for UI */
r.get("/me/course-access", requireUser, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const rows = await db
      .select({ courseId: purchases.courseId })
      .from(purchases)
      .where(eq(purchases.userId, userId));
    res.json({ courseIds: rows.map((x) => x.courseId) });
  } catch (e) {
    next(e);
  }
});

export default r;
