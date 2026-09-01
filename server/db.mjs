import { MongoClient } from "mongodb";

let client;
let database;

export async function getDb() {
  if (database) return database;
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new Error(
      "MONGODB_URI is not configured. Add it to .env before starting the API.",
    );
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
  await client.connect();
  database = client.db(process.env.MONGODB_DB_NAME || "billnest");
  return database;
}

export async function closeDb() {
  await client?.close();
  client = undefined;
  database = undefined;
}
