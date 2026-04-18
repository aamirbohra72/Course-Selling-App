import { verifyUserToken, verifyAdminToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";

function bearer(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

export function requireUser(req, _res, next) {
  try {
    const token = bearer(req);
    if (!token) throw new AppError("Unauthorized", 401);
    req.user = verifyUserToken(token);
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
}

export function requireAdmin(req, _res, next) {
  try {
    const token = bearer(req);
    if (!token) throw new AppError("Unauthorized", 401);
    req.admin = verifyAdminToken(token);
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
}
