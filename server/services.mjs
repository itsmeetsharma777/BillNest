import { ObjectId } from "mongodb";
import { customerId, moneyPaise, normalizePhone } from "./security.mjs";

export async function ensureCustomer(db, input) {
  const normalizedPhone = normalizePhone(input.phone);
  if (!normalizedPhone || !input.name?.trim()) {
    const error = new Error("Enter a customer name and valid mobile number.");
    error.status = 400;
    throw error;
  }
  const customers = db.collection("customers");
  const existing = await customers.findOne({ normalizedPhone });
  if (existing) return existing;
  const candidate = {
    customerId: customerId(),
    name: input.name.trim(),
    normalizedPhone,
    phone: normalizedPhone,
    email: input.email?.trim().toLowerCase() || null,
    address: input.address?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  try {
    const result = await customers.insertOne(candidate);
    return { ...candidate, _id: result.insertedId };
  } catch (error) {
    if (error?.code === 11000) {
      const winner = await customers.findOne({ normalizedPhone });
      if (winner) return winner;
    }
    throw error;
  }
}

export function calculateInvoice(items) {
  if (!Array.isArray(items) || !items.length) {
    const error = new Error("Add at least one invoice item.");
    error.status = 400;
    throw error;
  }
  let subtotalPaise = 0;
  let discountPaise = 0;
  let taxPaise = 0;
  const lines = items.map((raw) => {
    const quantity = Number(raw.quantity);
    const pricePaise = moneyPaise(raw.unitPrice);
    const discount = Number(raw.discount || 0);
    const gst = Number(raw.gst || 0);
    if (
      !raw.product?.trim() ||
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      discount < 0 ||
      discount > 100 ||
      gst < 0 ||
      gst > 100
    ) {
      const error = new Error(
        "Each invoice item needs a product, a positive whole-number quantity, and valid discount/GST percentages.",
      );
      error.status = 400;
      throw error;
    }
    const lineSubtotal = Math.round(quantity * pricePaise);
    const lineDiscount = Math.round(lineSubtotal * (discount / 100));
    const taxable = lineSubtotal - lineDiscount;
    const lineTax = Math.round(taxable * (gst / 100));
    subtotalPaise += lineSubtotal;
    discountPaise += lineDiscount;
    taxPaise += lineTax;
    return {
      product: raw.product.trim(),
      brand: raw.brand?.trim() || null,
      model: raw.model?.trim() || null,
      serial: raw.serial?.trim() || null,
      quantity,
      unitPricePaise: pricePaise,
      discount,
      gst,
      warrantyMonths: Number(raw.warrantyMonths || 0),
      warrantyEnd: raw.warrantyEnd || null,
      lineTotalPaise: taxable + lineTax,
    };
  });
  return {
    lines,
    subtotalPaise,
    discountPaise,
    taxPaise,
    totalPaise: subtotalPaise - discountPaise + taxPaise,
  };
}

export async function nextInvoiceNumber(db, shop) {
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: `invoice:${shop._id.toString()}` },
      { $inc: { sequence: 1 } },
      { upsert: true, returnDocument: "after" },
    );
  const sequence = result.sequence ?? result.value?.sequence;
  return `${shop.invoicePrefix || "INV"}-${new Date().getFullYear()}-${String(sequence).padStart(6, "0")}`;
}

export function id(value) {
  return new ObjectId(value);
}
