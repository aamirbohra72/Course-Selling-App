import "dotenv/config";

const required = ["DATABASE_URL", "JWT_SECRET"];

export function loadEnv() {
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const jwt = process.env.JWT_SECRET;
  if (jwt.length < 16) {
    throw new Error("JWT_SECRET must be at least 16 characters");
  }
  if (process.env.NODE_ENV === "production" && jwt.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
}
