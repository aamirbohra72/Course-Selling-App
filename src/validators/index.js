import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const courseCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10_000),
  priceCents: z.number().int().min(0).max(100_000_000),
  imageUrl: z.string().url().max(2000).optional().nullable(),
});

export const courseUpdateSchema = courseCreateSchema.partial();
