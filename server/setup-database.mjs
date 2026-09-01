import "dotenv/config";
import { getDb, closeDb } from "./db.mjs";

await getDb();
console.log("BillNest MongoDB indexes are ready.");
await closeDb();
