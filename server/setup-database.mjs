import "dotenv/config";
import { getDb, closeDb } from "./db.mjs";

const db = await getDb();
await Promise.all([
  db
    .collection("users")
    .createIndex({ email: 1 }, { unique: true, sparse: true }),
  db
    .collection("users")
    .createIndex({ phoneE164: 1 }, { unique: true, sparse: true }),
  db.collection("customers").createIndex({ customerId: 1 }, { unique: true }),
  db
    .collection("customers")
    .createIndex({ normalizedPhone: 1 }, { unique: true }),
  db.collection("shops").createIndex({ ownerUserId: 1 }, { unique: true }),
  db
    .collection("invoices")
    .createIndex({ shopId: 1, number: 1 }, { unique: true }),
  db.collection("invoices").createIndex({ customerId: 1, issuedAt: -1 }),
  db
    .collection("notifications")
    .createIndex({ dedupeKey: 1 }, { unique: true, sparse: true }),
  db.collection("auditLogs").createIndex({ actorUserId: 1, createdAt: -1 }),
]);
console.log("BillNest MongoDB indexes are ready.");
await closeDb();
