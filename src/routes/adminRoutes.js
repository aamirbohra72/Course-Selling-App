import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { admins, courses } from "../db/schema.js";
import { signAdminToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";
import { requireAdmin } from "../middleware/auth.js";
import { validateBody, parseUuidParam } from "../middleware/validate.js";
import {
  signupSchema,
  loginSchema,
  courseCreateSchema,
  courseUpdateSchema,
} from "../validators/index.js";
import { isAdminSignupAllowed } from "../lib/features.js";

const r = Router();

const BCRYPT_ROUNDS = 12;

r.post(
  "/signup",
  validateBody(signupSchema),
  async (req, res, next) => {
    try {
      if (!isAdminSignupAllowed()) {
        throw new AppError("Admin registration is disabled", 403);
      }
      const { email, password, name } = req.validatedBody;
      const existing = await db
        .select({ id: admins.id })
        .from(admins)
        .where(eq(admins.email, email.toLowerCase()))
        .limit(1);
      if (existing.length) {
        throw new AppError("Email already registered", 409);
      }
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const [row] = await db
        .insert(admins)
        .values({
          email: email.toLowerCase(),
          passwordHash,
          name,
        })
        .returning({ id: admins.id, email: admins.email, name: admins.name });
      const token = signAdminToken({ adminId: row.id });
      res.status(201).json({ admin: row, token });
    } catch (e) {
      next(e);
    }
  },
);

r.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email.toLowerCase()))
      .limit(1);
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new AppError("Invalid email or password", 401);
    }
    const token = signAdminToken({ adminId: admin.id });
    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      token,
    });
  } catch (e) {
    next(e);
  }
});

r.get("/courses", requireAdmin, async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const rows = await db
      .select()
      .from(courses)
      .where(eq(courses.adminId, adminId))
      .orderBy(asc(courses.createdAt));
    res.json({ courses: rows });
  } catch (e) {
    next(e);
  }
});

r.post(
  "/courses",
  requireAdmin,
  validateBody(courseCreateSchema),
  async (req, res, next) => {
    try {
      const adminId = req.admin.adminId;
      const { title, description, priceCents, imageUrl } = req.validatedBody;
      const [row] = await db
        .insert(courses)
        .values({
          title,
          description,
          priceCents,
          imageUrl: imageUrl ?? null,
          adminId,
        })
        .returning();
      res.status(201).json({ course: row });
    } catch (e) {
      next(e);
    }
  },
);

r.put(
  "/courses/:courseId",
  requireAdmin,
  parseUuidParam("courseId"),
  async (req, res, next) => {
    try {
      const adminId = req.admin.adminId;
      const courseId = req.paramsParsed.courseId;
      const parsed = courseUpdateSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());
      }
      const raw = parsed.data;
      const patch = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v !== undefined),
      );
      if (Object.keys(patch).length === 0) {
        throw new AppError("No fields to update", 400);
      }

      const [existing] = await db
        .select()
        .from(courses)
        .where(and(eq(courses.id, courseId), eq(courses.adminId, adminId)))
        .limit(1);
      if (!existing) throw new AppError("Course not found", 404);

      const [updated] = await db
        .update(courses)
        .set({
          ...patch,
          updatedAt: new Date(),
        })
        .where(and(eq(courses.id, courseId), eq(courses.adminId, adminId)))
        .returning();
      res.json({ course: updated });
    } catch (e) {
      next(e);
    }
  },
);

r.delete(
  "/courses/:courseId",
  requireAdmin,
  parseUuidParam("courseId"),
  async (req, res, next) => {
    try {
      const adminId = req.admin.adminId;
      const courseId = req.paramsParsed.courseId;
      const del = await db
        .delete(courses)
        .where(and(eq(courses.id, courseId), eq(courses.adminId, adminId)))
        .returning({ id: courses.id });
      if (!del.length) throw new AppError("Course not found", 404);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

export default r;
