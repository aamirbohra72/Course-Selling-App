import jwt from "jsonwebtoken";

const USER = "user";
const ADMIN = "admin";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "JWT_SECRET must be set and at least 16 characters for development",
    );
  }
  if (process.env.NODE_ENV === "production" && s.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  return s;
}

export function signUserToken(payload) {
  return jwt.sign({ sub: payload.userId, typ: USER }, secret(), {
    expiresIn: "7d",
  });
}

export function signAdminToken(payload) {
  return jwt.sign({ sub: payload.adminId, typ: ADMIN }, secret(), {
    expiresIn: "8h",
  });
}

export function verifyUserToken(token) {
  const decoded = jwt.verify(token, secret());
  if (decoded.typ !== USER) {
    throw new Error("Invalid token type");
  }
  return { userId: decoded.sub };
}

export function verifyAdminToken(token) {
  const decoded = jwt.verify(token, secret());
  if (decoded.typ !== ADMIN) {
    throw new Error("Invalid token type");
  }
  return { adminId: decoded.sub };
}
