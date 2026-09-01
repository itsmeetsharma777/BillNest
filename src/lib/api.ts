import type { Customer, Invoice, InvoiceItem, Role, Shop } from "../types";

type ApiPayload<T> = { data?: T; error?: { code?: string; message?: string } };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const csrfToken = () =>
  document.cookie
    .split("; ")
    .find((value) => value.startsWith("billnest_csrf="))
    ?.split("=")[1] || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(options.method || "GET") &&
    csrfToken()
  )
    headers.set("X-CSRF-Token", csrfToken());
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      "BillNest API is unavailable. Configure MongoDB Atlas, then restart the app.",
      503,
    );
  }

  const rawBody = await response.text().catch(() => "");
  let payload = {} as ApiPayload<T>;
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as ApiPayload<T>;
    } catch {
      payload = {
        error: {
          message: rawBody.slice(0, 300) || `Request failed with status ${response.status}`,
        },
      };
    }
  }

  if (!response.ok)
    throw new ApiError(
      payload.error?.message ||
        response.statusText ||
        `The request could not be completed (status ${response.status}).`,
      response.status,
    );
  return payload.data as T;
}

const string = (value: unknown) => (typeof value === "string" ? value : "");
const dateOnly = (value: unknown) =>
  string(value).slice(0, 10) || new Date().toISOString().slice(0, 10);
const rupees = (paise: unknown) => Number(paise || 0) / 100;

export function toShop(value: Record<string, unknown>, owner = ""): Shop {
  return {
    id: string(value.id),
    name: string(value.name),
    owner: string(value.owner) || owner,
    phone: string(value.phone),
    email: string(value.email),
    address: string(value.address),
    state: string(value.state),
    gstin: string(value.gstin),
  };
}

export function toCustomer(value: Record<string, unknown>): Customer {
  const phone = string(value.phone);
  return {
    id: string(value.id),
    customerId: string(value.customerId),
    name: string(value.name),
    phone,
    normalizedPhone: string(value.normalizedPhone) || phone,
    email: string(value.email) || undefined,
    address: string(value.address) || undefined,
  };
}

export function toInvoice(value: Record<string, unknown>): Invoice {
  const items = Array.isArray(value.items) ? value.items : [];
  return {
    id: string(value.id),
    number: string(value.number),
    customerId: string(value.customerId),
    shopId: string(value.shopId),
    shopName: string(value.shopName),
    date: dateOnly(value.issuedAt || value.date),
    status: (string(value.status) || "PAID") as Invoice["status"],
    paymentMethod: string(value.paymentMethod) || "Other",
    items: items.map((raw, index) => {
      const item = raw as Record<string, unknown>;
      return {
        id: string(item.id) || `${string(value.id)}-${index}`,
        product: string(item.product),
        brand: string(item.brand),
        model: string(item.model),
        serial: string(item.serial),
        quantity: Number(item.quantity || 0),
        unitPrice:
          item.unitPricePaise === undefined
            ? Number(item.unitPrice || 0)
            : rupees(item.unitPricePaise),
        discount: Number(item.discount || 0),
        gst: Number(item.gst || 0),
        warrantyMonths: Number(item.warrantyMonths || 0),
        warrantyEnd: dateOnly(item.warrantyEnd),
      } satisfies InvoiceItem;
    }),
    subtotal:
      value.subtotalPaise === undefined
        ? Number(value.subtotal || 0)
        : rupees(value.subtotalPaise),
    discount:
      value.discountPaise === undefined
        ? Number(value.discount || 0)
        : rupees(value.discountPaise),
    tax:
      value.taxPaise === undefined
        ? Number(value.tax || 0)
        : rupees(value.taxPaise),
    total:
      value.totalPaise === undefined
        ? Number(value.total || 0)
        : rupees(value.totalPaise),
    amountPaid:
      value.status === "PAID"
        ? value.totalPaise === undefined
          ? Number(value.total || 0)
          : rupees(value.totalPaise)
        : 0,
  };
}

type AuthResponse = {
  user: { name: string };
  shop?: Record<string, unknown>;
  customer?: Record<string, unknown>;
};

export async function authenticate(
  mode: "login" | "register",
  role: Role,
  details: {
    fullName: string;
    shopName: string;
    shopAddress: string;
    contact: string;
    email: string;
    password: string;
  },
) {
  const endpoint =
    mode === "login" ? "/api/auth/login" : `/api/auth/register/${role}`;
  const body =
    mode === "login"
      ? {
          identity: details.contact,
          password: details.password,
          role: role.toUpperCase(),
        }
      : role === "shopkeeper"
        ? {
            ownerName: details.fullName,
            shopName: details.shopName,
            address: details.shopAddress,
            phone: details.contact,
            email: details.email,
            password: details.password,
          }
        : {
            name: details.fullName,
            phone: details.contact,
            email: details.email,
            address: details.shopAddress,
            password: details.password,
          };
  const response = await request<AuthResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (role === "shopkeeper" && response.shop)
    return {
      profileName: response.user.name,
      shop: toShop(response.shop, response.user.name),
    };
  if (role === "customer" && response.customer)
    return {
      profileName: response.user.name,
      customer: toCustomer(response.customer),
    };
  throw new ApiError(
    "The account response was incomplete. Please try again.",
    500,
  );
}

export async function fetchInvoices() {
  const response = await request<Record<string, unknown>[]>("/api/invoices");
  return response.map(toInvoice);
}

export async function createInvoice(invoice: Invoice, customer: Customer) {
  const response = await request<Record<string, unknown>>("/api/invoices", {
    method: "POST",
    body: JSON.stringify({
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      customer,
      items: invoice.items,
    }),
  });
  return {
    invoice: toInvoice(response),
    customer: toCustomer(response.customer as Record<string, unknown>),
  };
}

export async function updateShop(shop: Shop) {
  const response = await request<Record<string, unknown>>("/api/shops/me", {
    method: "PATCH",
    body: JSON.stringify(shop),
  });
  return toShop(response, shop.owner);
}

export async function endSession() {
  await request<undefined>("/api/auth/logout", { method: "POST" });
}

export const isApiUnavailable = (error: unknown) =>
  error instanceof ApiError && error.status === 503;
