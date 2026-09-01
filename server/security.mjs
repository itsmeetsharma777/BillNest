import jwt from "jsonwebtoken";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js/mobile";

export const SESSION_COOKIE = "billnest_session";
export const CSRF_COOKIE = "billnest_csrf";

export function normalizePhone(value) {
  const phone = parsePhoneNumberFromString(value || "", "IN");
  return phone?.isValid() ? phone.number : null;
}

export function customerId() {
  return `CUS-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phoneE164,
  };
}

export function sessionOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 8,
    path: "/",
  };
}

export function setCsrfCookie(response) {
  response.cookie(CSRF_COOKIE, randomBytes(32).toString("hex"), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 8,
    path: "/",
  });
}

export function requireCsrf(request, response, next) {
  const header = request.get("x-csrf-token") || "";
  const cookie = request.cookies?.[CSRF_COOKIE] || "";
  const valid =
    header.length === cookie.length &&
    header.length > 0 &&
    timingSafeEqual(Buffer.from(header), Buffer.from(cookie));
  if (!valid)
    return response
      .status(403)
      .json({
        error: {
          code: "CSRF_INVALID",
          message: "Please refresh the page and try again.",
        },
      });
  next();
}

function authSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  return process.env.JWT_SECRET;
}

export function signSession(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, authSecret(), {
    expiresIn: "8h",
    issuer: "billnest",
  });
}

export function requireAuth(roles = []) {
  return (request, response, next) => {
    try {
      const token = request.cookies?.[SESSION_COOKIE];
      if (!token)
        return response
          .status(401)
          .json({
            error: {
              code: "AUTH_REQUIRED",
              message: "Please sign in to continue.",
            },
          });
      const claims = jwt.verify(token, authSecret(), { issuer: "billnest" });
      if (roles.length && !roles.includes(claims.role))
        return response
          .status(403)
          .json({
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission for this action.",
            },
          });
      request.auth = claims;
      next();
    } catch {
      response
        .status(401)
        .json({
          error: {
            code: "INVALID_SESSION",
            message: "Your session has expired. Please sign in again.",
          },
        });
    }
  };
}

export function moneyPaise(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error("Money values must be non-negative numbers.");
  return Math.round(amount * 100);
}
