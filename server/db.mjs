import { MongoClient } from "mongodb";

let client;
let database;
let indexesPromise;

async function ensureIndexes(db) {
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
}

export async function getDb() {
  if (database) {
    await indexesPromise;
    return database;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new Error(
      "MONGODB_URI is not configured. Add it to .env before starting the API.",
    );
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
  await client.connect();
  database = client.db(process.env.MONGODB_DB_NAME || "billnest");
  indexesPromise ??= ensureIndexes(database);
  await indexesPromise;
  return database;
}

export async function closeDb() {
  await client?.close();
  client = undefined;
  database = undefined;
  indexesPromise = undefined;
}
