import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { loadEnv } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { getPool, closePool } from "./db/index.js";

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const app = express();
app.set("trust proxy", 1);

const isProd = process.env.NODE_ENV === "production";
const corsOrigin = process.env.CORS_ORIGIN?.trim();
const corsAllowedOrigin =
  corsOrigin === "*"
    ? true
    : corsOrigin
      ? corsOrigin.split(",").map((s) => s.trim())
      : isProd
        ? false
        : true;

app.use(
  cors({
    origin: corsAllowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "512kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get("/health/ready", async (_req, res) => {
  try {
    await getPool().query("select 1");
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({ ok: false, db: false });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.use(express.static(publicDir));

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Set PORT to a free port in .env (e.g. PORT=3001) or stop the other process.`,
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});

function shutdown(signal) {
  console.log(`${signal}: shutting down…`);
  server.close(() => {
    closePool()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
