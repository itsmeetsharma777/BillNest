import "dotenv/config";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./db.mjs";
import {
  SESSION_COOKIE,
  normalizePhone,
  publicUser,
  requireAuth,
  requireCsrf,
  sessionOptions,
  setCsrfCookie,
  signSession,
} from "./security.mjs";
import {
  calculateInvoice,
  ensureCustomer,
  nextInvoiceNumber,
} from "./services.mjs";

const app = express();
const port = Number(process.env.PORT || 4000);
const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  console.warn(
    "Set a JWT_SECRET of at least 32 characters before using authentication.",
  );
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: "TOO_MANY_ATTEMPTS",
        message: "Please wait before trying again.",
      },
    },
  }),
);

function safe(value) {
  return String(value || "").trim();
}
function fail(response, status, code, message) {
  return response.status(status).json({ error: { code, message } });
}
async function audit(db, request, action, entityType, entityId) {
  await db.collection("auditLogs").insertOne({
    actorUserId: request.auth?.sub ? new ObjectId(request.auth.sub) : null,
    action,
    entityType,
    entityId: entityId ?? null,
    ipHash: request.ip
      ? createHash("sha256")
          .update(
            `${process.env.AUDIT_LOG_SALT || process.env.JWT_SECRET || "billnest"}:${request.ip}`,
          )
          .digest("hex")
      : null,
    createdAt: new Date(),
  });
}

app.get("/api/health", async (_request, response) => {
  try {
    await getDb();
    response.json({ data: { status: "ok", database: "connected" } });
  } catch {
    response
      .status(503)
      .json({
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "MongoDB is not configured or unavailable.",
        },
      });
  }
});

app.post("/api/auth/register/shopkeeper", async (request, response, next) => {
  try {
    const { ownerName, shopName, phone, email, password, address } =
      request.body;
    const normalizedPhone = normalizePhone(phone);
    if (
      !safe(ownerName) ||
      !safe(shopName) ||
      !safe(address) ||
      !normalizedPhone ||
      !safe(email) ||
      String(password || "").length < 8
    )
      return fail(
        response,
        400,
        "INVALID_INPUT",
        "Provide a name, shop name, valid phone, email, address, and an 8-character password.",
      );
    const db = await getDb();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      role: "SHOPKEEPER",
      name: safe(ownerName),
      email: safe(email).toLowerCase(),
      phoneE164: normalizedPhone,
      passwordHash,
      createdAt: new Date(),
    };
    let inserted;
    try {
      inserted = await db.collection("users").insertOne(user);
    } catch (error) {
      if (error?.code === 11000)
        return fail(
          response,
          409,
          "ACCOUNT_EXISTS",
          "An account with that email or phone already exists.",
        );
      throw error;
    }
    const shop = {
      ownerUserId: inserted.insertedId,
      name: safe(shopName),
      phone: normalizedPhone,
      email: user.email,
      address: safe(address),
      invoicePrefix:
        safe(shopName)
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 5)
          .toUpperCase() || "INV",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const shopResult = await db.collection("shops").insertOne(shop);
    setCsrfCookie(response);
    response
      .cookie(
        SESSION_COOKIE,
        signSession({ ...user, _id: inserted.insertedId }),
        sessionOptions(),
      )
      .status(201)
      .json({
        data: {
          user: publicUser({ ...user, _id: inserted.insertedId }),
          shop: {
            ...shop,
            owner: user.name,
            id: shopResult.insertedId.toString(),
          },
        },
      });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register/customer", async (request, response, next) => {
  try {
    const { name, phone, email, password, address } = request.body;
    const normalizedPhone = normalizePhone(phone);
    if (!safe(name) || !normalizedPhone || String(password || "").length < 8)
      return fail(
        response,
        400,
        "INVALID_INPUT",
        "Provide a name, valid phone, and an 8-character password.",
      );
    const db = await getDb();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      role: "CUSTOMER",
      name: safe(name),
      email: safe(email).toLowerCase() || null,
      phoneE164: normalizedPhone,
      passwordHash,
      createdAt: new Date(),
    };
    let inserted;
    try {
      inserted = await db.collection("users").insertOne(user);
    } catch (error) {
      if (error?.code === 11000)
        return fail(
          response,
          409,
          "ACCOUNT_EXISTS",
          "An account with that email or phone already exists.",
        );
      throw error;
    }
    const customer = await ensureCustomer(db, { name, phone, email, address });
    await db
      .collection("customers")
      .updateOne(
        { _id: customer._id },
        { $set: { userId: inserted.insertedId, updatedAt: new Date() } },
      );
    setCsrfCookie(response);
    response
      .cookie(
        SESSION_COOKIE,
        signSession({ ...user, _id: inserted.insertedId }),
        sessionOptions(),
      )
      .status(201)
      .json({
        data: {
          user: publicUser({ ...user, _id: inserted.insertedId }),
          customer: { ...customer, id: customer._id.toString() },
        },
      });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const identity = safe(request.body.identity).toLowerCase();
    const password = String(request.body.password || "");
    const role = safe(request.body.role).toUpperCase();
    const normalizedPhone = normalizePhone(identity);
    const db = await getDb();
    const user = await db
      .collection("users")
      .findOne({
        role,
        $or: [
          { email: identity },
          ...(normalizedPhone ? [{ phoneE164: normalizedPhone }] : []),
        ],
      });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return fail(
        response,
        401,
        "INVALID_CREDENTIALS",
        "The sign-in details are incorrect.",
      );
    const profile =
      user.role === "SHOPKEEPER"
        ? await db.collection("shops").findOne({ ownerUserId: user._id })
        : await db.collection("customers").findOne({ userId: user._id });
    await audit(
      db,
      { auth: { sub: user._id.toString() } },
      "LOGIN",
      user.role,
      user._id,
    );
    setCsrfCookie(response);
    response
      .cookie(SESSION_COOKIE, signSession(user), sessionOptions())
      .json({
        data: {
          user: publicUser(user),
          [user.role === "SHOPKEEPER" ? "shop" : "customer"]: profile && {
            ...profile,
            owner: user.name,
            id: profile._id.toString(),
          },
        },
      });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/auth/logout",
  requireAuth(),
  requireCsrf,
  async (request, response, next) => {
    try {
      const db = await getDb();
      await audit(
        db,
        request,
        "LOGOUT",
        "USER",
        new ObjectId(request.auth.sub),
      );
      response
        .clearCookie(SESSION_COOKIE, { path: "/" })
        .clearCookie("billnest_csrf", { path: "/" })
        .status(204)
        .end();
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  "/api/shops/me",
  requireAuth(["SHOPKEEPER"]),
  async (request, response, next) => {
    try {
      const shop = await (
        await getDb()
      )
        .collection("shops")
        .findOne({ ownerUserId: new ObjectId(request.auth.sub) });
      if (!shop)
        return fail(response, 404, "SHOP_NOT_FOUND", "Shop profile not found.");
      response.json({ data: { ...shop, id: shop._id.toString() } });
    } catch (error) {
      next(error);
    }
  },
);
app.patch(
  "/api/shops/me",
  requireAuth(["SHOPKEEPER"]),
  requireCsrf,
  async (request, response, next) => {
    try {
      const db = await getDb();
      const userId = new ObjectId(request.auth.sub);
      const shop = await db
        .collection("shops")
        .findOne({ ownerUserId: userId });
      if (!shop)
        return fail(response, 404, "SHOP_NOT_FOUND", "Shop profile not found.");
      const name = safe(request.body.name);
      const address = safe(request.body.address);
      const phone = normalizePhone(request.body.phone);
      const email = safe(request.body.email).toLowerCase();
      const gstin = safe(request.body.gstin).toUpperCase();
      const owner = safe(request.body.owner);
      if (!name || !address || !phone || !email || !owner)
        return fail(
          response,
          400,
          "INVALID_INPUT",
          "Provide a shop name, owner, valid phone, email, and address.",
        );
      const changes = {
        name,
        address,
        phone,
        email,
        gstin: gstin || null,
        invoicePrefix:
          name
            .replace(/[^a-z0-9]/gi, "")
            .slice(0, 5)
            .toUpperCase() || "INV",
        updatedAt: new Date(),
      };
      await db
        .collection("shops")
        .updateOne({ _id: shop._id }, { $set: changes });
      await db
        .collection("users")
        .updateOne(
          { _id: userId },
          { $set: { name: owner, email, phoneE164: phone } },
        );
      await audit(db, request, "SHOP_UPDATED", "SHOP", shop._id);
      response.json({
        data: { ...shop, ...changes, owner, id: shop._id.toString() },
      });
    } catch (error) {
      next(error);
    }
  },
);
app.get(
  "/api/customers/lookup",
  requireAuth(["SHOPKEEPER"]),
  async (request, response, next) => {
    try {
      const phone = normalizePhone(request.query.phone);
      if (!phone)
        return fail(
          response,
          400,
          "INVALID_PHONE",
          "Enter a valid phone number.",
        );
      const customer = await (
        await getDb()
      )
        .collection("customers")
        .findOne({ normalizedPhone: phone });
      response.json({
        data: customer
          ? {
              id: customer._id.toString(),
              customerId: customer.customerId,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
            }
          : null,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.get("/api/invoices", requireAuth(), async (request, response, next) => {
  try {
    const db = await getDb();
    const ownerId = new ObjectId(request.auth.sub);
    const scope =
      request.auth.role === "SHOPKEEPER"
        ? {
            shopId: (
              await db.collection("shops").findOne({ ownerUserId: ownerId })
            )?._id,
          }
        : {
            customerId: (
              await db.collection("customers").findOne({ userId: ownerId })
            )?._id,
          };
    const invoices = await db
      .collection("invoices")
      .find(scope)
      .sort({ issuedAt: -1 })
      .limit(100)
      .toArray();
    response.json({
      data: invoices.map((invoice) => ({
        ...invoice,
        id: invoice._id.toString(),
        shopId: invoice.shopId.toString(),
        customerId: invoice.customerId.toString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/invoices",
  requireAuth(["SHOPKEEPER"]),
  requireCsrf,
  async (request, response, next) => {
    try {
      const db = await getDb();
      const shop = await db
        .collection("shops")
        .findOne({ ownerUserId: new ObjectId(request.auth.sub) });
      if (!shop)
        return fail(response, 404, "SHOP_NOT_FOUND", "Shop profile not found.");
      const customer = await ensureCustomer(db, request.body.customer || {});
      const calculation = calculateInvoice(request.body.items || []);
      const status = safe(request.body.status).toUpperCase() || "PAID";
      if (!["DRAFT", "PAID"].includes(status))
        return fail(
          response,
          400,
          "INVALID_STATUS",
          "Only draft or paid invoices can be created.",
        );
      const number = await nextInvoiceNumber(db, shop);
      const invoice = {
        number,
        shopId: shop._id,
        customerId: customer._id,
        shopName: shop.name,
        customerSnapshot: {
          name: customer.name,
          customerId: customer.customerId,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
        },
        shopSnapshot: {
          name: shop.name,
          address: shop.address,
          phone: shop.phone,
          email: shop.email,
          gstin: shop.gstin || null,
        },
        status,
        paymentMethod: safe(request.body.paymentMethod) || "Other",
        items: calculation.lines,
        subtotalPaise: calculation.subtotalPaise,
        discountPaise: calculation.discountPaise,
        taxPaise: calculation.taxPaise,
        totalPaise: calculation.totalPaise,
        issuedAt: new Date(),
        createdAt: new Date(),
      };
      const result = await db.collection("invoices").insertOne(invoice);
      await audit(db, request, "INVOICE_CREATED", "INVOICE", result.insertedId);
      response
        .status(201)
        .json({
          data: {
            ...invoice,
            id: result.insertedId.toString(),
            shopId: shop._id.toString(),
            customerId: customer._id.toString(),
            customer: {
              id: customer._id.toString(),
              customerId: customer.customerId,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
            },
          },
        });
    } catch (error) {
      next(error);
    }
  },
);

app.use((error, _request, response, _next) => {
  console.error(error?.message || error);
  if (error?.message?.includes("MONGODB_URI"))
    return fail(
      response,
      503,
      "DATABASE_UNAVAILABLE",
      "MongoDB is not configured. Follow docs/mongodb-atlas.md.",
    );
  if (error?.code === 11000)
    return fail(
      response,
      409,
      "DUPLICATE_RECORD",
      "That record already exists.",
    );
  return fail(
    response,
    error.status || 500,
    "SERVER_ERROR",
    error.status ? error.message : "Something went wrong. Please try again.",
  );
});
export default app;

if (!process.env.VERCEL) {
  app.listen(port, () =>
    console.log(`BillNest API listening on http://localhost:${port}`),
  );
}
