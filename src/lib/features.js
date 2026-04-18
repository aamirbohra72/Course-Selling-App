/**
 * Admin self-signup: off by default in production unless ADMIN_SIGNUP_ENABLED=true.
 * In development, allowed unless ADMIN_SIGNUP_ENABLED=false.
 */
export function isAdminSignupAllowed() {
  const v = process.env.ADMIN_SIGNUP_ENABLED?.toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return process.env.NODE_ENV !== "production";
}
