import { AppError } from "../lib/errors.js";

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const body = {
      error: err.message,
      code: err.code,
    };
    if (err.details !== undefined) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  const isProd = process.env.NODE_ENV === "production";
  console.error(err);
  return res.status(500).json({
    error: isProd ? "Internal server error" : err.message,
  });
}
