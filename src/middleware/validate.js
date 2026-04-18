import { z } from "zod";
import { AppError } from "../lib/errors.js";

const uuidParam = z.string().uuid();

export function validateBody(schema) {
  return (req, _res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      return next(
        new AppError("Validation failed", 400, "VALIDATION_ERROR", r.error.flatten()),
      );
    }
    req.validatedBody = r.data;
    next();
  };
}

export function parseUuidParam(name) {
  return (req, _res, next) => {
    const r = uuidParam.safeParse(req.params[name]);
    if (!r.success) {
      return next(new AppError("Invalid id", 400, "INVALID_ID"));
    }
    req.paramsParsed = { ...(req.paramsParsed ?? {}), [name]: r.data };
    next();
  };
}
