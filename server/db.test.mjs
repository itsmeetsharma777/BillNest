import { describe, expect, it } from "vitest";
import { assertMongoUri } from "./db.mjs";

describe("Atlas connection configuration", () => {
  it("rejects an omitted MongoDB connection string", () => {
    expect(() => assertMongoUri("")).toThrow("MONGODB_URI is not configured");
  });

  it("rejects an unedited Atlas placeholder before attempting a connection", () => {
    expect(() =>
      assertMongoUri(
        "mongodb+srv://billnest_app:<db_password>@cluster.mongodb.net/?retryWrites=true",
      ),
    ).toThrow("still contains a placeholder");
  });

  it("accepts an ordinary fully supplied Atlas URI", () => {
    expect(
      assertMongoUri(
        "mongodb+srv://billnest_app:encoded-password@cluster.mongodb.net/?retryWrites=true",
      ),
    ).toContain("encoded-password");
  });
});
