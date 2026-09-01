import { describe, expect, it } from "vitest";
import { calculateInvoice, nextInvoiceNumber } from "./services.mjs";

describe("server invoice calculations", () => {
  it("calculates discount and GST in integer paise", () => {
    const invoice = calculateInvoice([
      {
        product: "Service plan",
        quantity: 2,
        unitPrice: 1000.99,
        discount: 10,
        gst: 18,
      },
    ]);
    expect(invoice).toMatchObject({
      subtotalPaise: 200198,
      discountPaise: 20020,
      taxPaise: 32432,
      totalPaise: 212610,
    });
    expect(invoice.lines[0].lineTotalPaise).toBe(212610);
  });

  it("rejects empty, fractional, and malformed invoice lines", () => {
    expect(() => calculateInvoice([])).toThrow("Add at least one invoice item");
    expect(() =>
      calculateInvoice([
        { product: "Item", quantity: 1.5, unitPrice: 10, discount: 0, gst: 0 },
      ]),
    ).toThrow("positive whole-number quantity");
    expect(() =>
      calculateInvoice([
        { product: "", quantity: 1, unitPrice: 10, discount: 0, gst: 0 },
      ]),
    ).toThrow("needs a product");
  });

  it("uses the atomic counter value for a per-shop invoice number", async () => {
    const db = {
      collection: () => ({ findOneAndUpdate: async () => ({ sequence: 17 }) }),
    };
    await expect(
      nextInvoiceNumber(db, {
        _id: { toString: () => "shop-1" },
        invoicePrefix: "NEST",
      }),
    ).resolves.toBe("NEST-2026-000017");
  });
});
