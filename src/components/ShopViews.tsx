import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import type { Customer, Invoice, InvoiceItem, Shop } from "../types";
import {
  addMonths,
  expiryStatus,
  formatCurrency,
  formatDate,
  invoiceTotals,
  normalisePhone,
} from "../lib/format";
import { generateCustomerId } from "../lib/customer-identity";
import {
  Button,
  CopyId,
  EmptyState,
  MetricCard,
  Modal,
  SearchInput,
  StatusBadge,
  Step,
} from "./ui";
import type { View } from "./Layout";

const titles = {
  invoices: ["Invoices", "Review, share, and manage every sale."],
  customers: ["Customers", "Customers who have purchased from your shop."],
  warranties: [
    "Warranties",
    "A clear view of the coverage your customers rely on.",
  ],
  reports: ["Reports", "A concise view of how the business is moving."],
  settings: ["Shop settings", "The details that appear on future invoices."],
} as const;
export const formatPdfCurrency = (amount: number) =>
  `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
const money = (amount: number) => formatPdfCurrency(amount);

export function ShopDashboard({
  invoices,
  customers,
  shop,
  onView,
}: {
  invoices: Invoice[];
  customers: Customer[];
  shop: Shop;
  onView: (view: View) => void;
}) {
  const completed = invoices.filter(
    (invoice) => invoice.status !== "DRAFT" && invoice.status !== "CANCELLED",
  );
  const sales = completed.reduce((sum, invoice) => sum + invoice.total, 0);
  const expiring = invoices
    .flatMap((invoice) => invoice.items)
    .filter(
      (item) =>
        expiryStatus(item.warrantyEnd, item.warrantyMonths) === "EXPIRING SOON",
    ).length;
  return (
    <>
      <section className="page-heading dashboard-heading">
        <div>
          <p className="overline">YOUR WORKSPACE</p>
          <h1>
            Good morning, {shop.owner || "there"} <span>✦</span>
          </h1>
          <p>{shop.name} is ready for its next sale.</p>
        </div>
        <Button onClick={() => onView("create-invoice")}>
          <Plus size={17} />
          Create invoice
        </Button>
      </section>
      <section className="metrics">
        <MetricCard
          label="Sales this month"
          value={formatCurrency(sales)}
          trend={
            invoices.length ? "Recorded invoice sales" : "No sales recorded yet"
          }
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          label="Invoices issued"
          value={String(invoices.length).padStart(2, "0")}
          trend="Finalised and draft invoices"
          tone="blue"
          icon={<ReceiptText size={20} />}
        />
        <MetricCard
          label="Customers"
          value={String(customers.length).padStart(3, "0")}
          trend="Customers for this shop"
          tone="amber"
          icon={<UsersRound size={20} />}
        />
        <MetricCard
          label="Need attention"
          value={String(expiring).padStart(2, "0")}
          trend="Warranties expiring soon"
          tone="rose"
          icon={<ShieldCheck size={20} />}
        />
      </section>
      <section className="dashboard-grid">
        <article className="panel sales-panel">
          <header>
            <div>
              <h2>Sales overview</h2>
              <p>Sales will appear as you finalise invoices.</p>
            </div>
          </header>
          {invoices.length ? (
            <div className="chart-wrap">
              <div className="chart-y">
                <span>High</span>
                <span>Mid</span>
                <span>Low</span>
                <span>0</span>
              </div>
              <div className="chart-area">
                <div className="chart-lines">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <svg
                  viewBox="0 0 600 220"
                  preserveAspectRatio="none"
                  aria-label="Sales trend"
                >
                  <path
                    d="M0 185 C68 155,122 171,180 126 S297 123,365 90 S492 86,600 22 L600 220 L0 220Z"
                    fill="rgba(22,136,117,.15)"
                  />
                  <path
                    d="M0 185 C68 155,122 171,180 126 S297 123,365 90 S492 86,600 22"
                    fill="none"
                    stroke="#168875"
                    strokeWidth="3"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Your sales story starts here"
              body="Create your first invoice to see revenue trends."
              action={
                <Button onClick={() => onView("create-invoice")}>
                  Create invoice
                </Button>
              }
            />
          )}
        </article>
        <article className="panel attention-panel">
          <header>
            <div>
              <h2>Needs attention</h2>
              <p>Keep customers in the loop</p>
            </div>
            <button onClick={() => onView("warranties")}>View all</button>
          </header>
          {expiring ? (
            invoices
              .flatMap((invoice) =>
                invoice.items.map((item) => ({ invoice, item })),
              )
              .filter(
                (row) =>
                  expiryStatus(
                    row.item.warrantyEnd,
                    row.item.warrantyMonths,
                  ) === "EXPIRING SOON",
              )
              .map(({ invoice, item }) => (
                <div className="attention-row" key={item.id}>
                  <span className="product-avatar rose">◉</span>
                  <div>
                    <b>{item.product}</b>
                    <small>
                      {invoice.number} · ends {formatDate(item.warrantyEnd)}
                    </small>
                  </div>
                  <StatusBadge status="EXPIRING SOON" />
                </div>
              ))
          ) : (
            <EmptyState
              title="All clear"
              body="No warranties need attention today."
            />
          )}
        </article>
      </section>
      <section className="panel recent-panel">
        <header>
          <div>
            <h2>Recent invoices</h2>
            <p>Latest activity at {shop.name}</p>
          </div>
          <button onClick={() => onView("invoices")}>
            View all invoices <ChevronRight size={15} />
          </button>
        </header>
        {invoices.length ? (
          <InvoiceTable
            invoices={invoices.slice(0, 4)}
            customers={customers}
            shop={shop}
            compact
          />
        ) : (
          <EmptyState
            title="No invoices yet"
            body="Your first sale will appear here."
            action={
              <Button onClick={() => onView("create-invoice")}>
                Create invoice
              </Button>
            }
          />
        )}
      </section>
    </>
  );
}

export function InvoiceTable({
  invoices,
  customers,
  shop,
  compact = false,
  onDownload,
  onCancel,
}: {
  invoices: Invoice[];
  customers: Customer[];
  shop?: Shop;
  compact?: boolean;
  onDownload?: (invoice: Invoice) => void;
  onCancel?: (invoice: Invoice) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Status</th>
            {!compact && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const customer = customers.find(
              (item) => item.id === invoice.customerId,
            );
            return (
              <tr key={invoice.id}>
                <td>
                  <b>{invoice.number}</b>
                  <small>{invoice.items[0]?.product || "No items"}</small>
                </td>
                <td>
                  <span className="customer-cell">
                    <i>{customer?.name.slice(0, 1) ?? "?"}</i>
                    <span>
                      <b>{customer?.name ?? "Customer"}</b>
                      <small>{customer?.customerId ?? "—"}</small>
                    </span>
                  </span>
                </td>
                <td>{formatDate(invoice.date)}</td>
                <td>{invoice.paymentMethod}</td>
                <td>
                  <b>{formatCurrency(invoice.total)}</b>
                </td>
                <td>
                  <StatusBadge status={invoice.status} />
                </td>
                {!compact && (
                  <td>
                    <div className="row-actions">
                      <button
                        title="Download invoice"
                        onClick={() =>
                          onDownload?.(invoice) ??
                          downloadInvoice(invoice, customer, shop)
                        }
                      >
                        <Download size={16} />
                      </button>
                      {invoice.status !== "CANCELLED" && (
                        <button
                          title="Cancel invoice"
                          onClick={() => onCancel?.(invoice)}
                        >
                          <X size={16} />
                        </button>
                      )}
                      <button title="More options">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ShopInvoices({
  invoices,
  customers,
  shop,
  setInvoices,
  toast,
}: {
  invoices: Invoice[];
  customers: Customer[];
  shop: Shop;
  setInvoices: (invoices: Invoice[]) => void;
  toast: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [candidate, setCandidate] = useState<Invoice | null>(null);
  const filtered = invoices.filter((invoice) => {
    const customer = customers.find((item) => item.id === invoice.customerId);
    return (
      `${invoice.number} ${customer?.name || ""} ${customer?.customerId || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "ALL" || invoice.status === status)
    );
  });
  return (
    <>
      <PageHeading
        page="invoices"
        shopName={shop.name}
        action={
          <Button variant="secondary" onClick={() => exportCsv(invoices)}>
            <Download size={16} />
            Export CSV
          </Button>
        }
      />
      <section className="toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search invoice number or customer"
        />
        <div>
          <button className="filter-button">
            <Filter size={16} />
            All dates
          </button>
          <select
            aria-label="Filter invoice status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </section>
      <section className="panel list-panel">
        <header>
          <div>
            <h2>
              {filtered.length} invoice{filtered.length === 1 ? "" : "s"}
            </h2>
            <p>Showing records created by {shop.name}.</p>
          </div>
        </header>
        {filtered.length ? (
          <InvoiceTable
            invoices={filtered}
            customers={customers}
            shop={shop}
            onCancel={setCandidate}
          />
        ) : (
          <EmptyState
            title="No invoices found"
            body="Try a different search or create a new invoice."
          />
        )}
      </section>
      {candidate && (
        <Modal title="Cancel this invoice?" onClose={() => setCandidate(null)}>
          <p className="modal-copy">
            This preserves the invoice for audit purposes and excludes it from
            sales totals.
          </p>
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setCandidate(null)}>
              Keep invoice
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setInvoices(
                  invoices.map((invoice) =>
                    invoice.id === candidate.id
                      ? { ...invoice, status: "CANCELLED" }
                      : invoice,
                  ),
                );
                setCandidate(null);
                toast("Invoice cancelled and kept in the audit trail.");
              }}
            >
              Cancel invoice
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function Customers({
  customers,
  invoices,
  shopName,
}: {
  customers: Customer[];
  invoices: Invoice[];
  shopName: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = customers.filter((customer) =>
    `${customer.name} ${customer.phone} ${customer.email || ""} ${customer.customerId}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading page="customers" shopName={shopName} />
      <section className="toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name, phone, customer ID"
        />
      </section>
      <section className="panel list-panel">
        <header>
          <div>
            <h2>{filtered.length} customers</h2>
            <p>Only customers with transactions from {shopName} are shown.</p>
          </div>
        </header>
        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Customer ID</th>
                  <th>Contact</th>
                  <th>Purchases</th>
                  <th>Total spent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const purchases = invoices.filter(
                    (invoice) =>
                      invoice.customerId === customer.id &&
                      invoice.status !== "CANCELLED",
                  );
                  return (
                    <tr key={customer.id}>
                      <td>
                        <span className="customer-cell">
                          <i>{customer.name.slice(0, 1)}</i>
                          <span>
                            <b>{customer.name}</b>
                            <small>
                              {customer.address || "No address saved"}
                            </small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <CopyId value={customer.customerId} />
                      </td>
                      <td>
                        <b>{customer.phone}</b>
                        <small>{customer.email || "No email"}</small>
                      </td>
                      <td>{purchases.length}</td>
                      <td>
                        <b>
                          {formatCurrency(
                            purchases.reduce(
                              (sum, invoice) => sum + invoice.total,
                              0,
                            ),
                          )}
                        </b>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No customers yet"
            body="Customers appear after you create invoices for them."
          />
        )}
      </section>
    </>
  );
}

export function Warranties({
  invoices,
  customers,
  shop,
  customerMode = false,
}: {
  invoices: Invoice[];
  customers: Customer[];
  shop?: Shop;
  customerMode?: boolean;
}) {
  const [sort, setSort] = useState("expiring");
  const rows = invoices
    .flatMap((invoice) =>
      invoice.items
        .filter((item) => item.warrantyMonths)
        .map((item) => ({
          invoice,
          item,
          customer: customers.find(
            (person) => person.id === invoice.customerId,
          ),
        })),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.item.product.localeCompare(b.item.product)
        : a.item.warrantyEnd.localeCompare(b.item.warrantyEnd),
    );
  return (
    <>
      {!customerMode ? (
        <PageHeading page="warranties" shopName={shop?.name || "Your shop"} />
      ) : (
        <section className="page-heading">
          <div>
            <p className="overline">YOUR PURCHASE PROTECTION</p>
            <h1>My warranties</h1>
            <p>Everything you own, with the details you need.</p>
          </div>
        </section>
      )}
      <section className="warranty-summary">
        <div>
          <b>
            {
              rows.filter(
                (row) =>
                  expiryStatus(
                    row.item.warrantyEnd,
                    row.item.warrantyMonths,
                  ) === "ACTIVE",
              ).length
            }
          </b>
          <span>Active</span>
        </div>
        <div>
          <b>
            {
              rows.filter(
                (row) =>
                  expiryStatus(
                    row.item.warrantyEnd,
                    row.item.warrantyMonths,
                  ) === "EXPIRING SOON",
              ).length
            }
          </b>
          <span>Expiring soon</span>
        </div>
        <div>
          <b>
            {
              rows.filter(
                (row) =>
                  expiryStatus(
                    row.item.warrantyEnd,
                    row.item.warrantyMonths,
                  ) === "EXPIRED",
              ).length
            }
          </b>
          <span>Expired</span>
        </div>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="expiring">Expiring soon first</option>
          <option value="name">Product name</option>
        </select>
      </section>
      <section className="warranty-grid">
        {rows.map(({ invoice, item, customer }) => {
          const status = expiryStatus(item.warrantyEnd, item.warrantyMonths);
          return (
            <article className="warranty-card" key={item.id}>
              <header>
                <span
                  className={`product-avatar ${status === "EXPIRING SOON" ? "rose" : "teal"}`}
                >
                  ◉
                </span>
                <StatusBadge status={status} />
              </header>
              <h3>{item.product}</h3>
              <p>
                {item.brand || "Product"} {item.model ? `· ${item.model}` : ""}
              </p>
              <div className="warranty-date">
                <span>Coverage ends</span>
                <b>{formatDate(item.warrantyEnd)}</b>
                <small>
                  {status === "EXPIRED"
                    ? "Expired"
                    : `${Math.max(0, Math.ceil((new Date(`${item.warrantyEnd}T12:00:00`).getTime() - Date.now()) / 86400000))} days remaining`}
                </small>
              </div>
              <footer>
                <span>{customerMode ? invoice.shopName : customer?.name}</span>
                <button
                  onClick={() =>
                    downloadWarranty(item, invoice, customer, shop)
                  }
                >
                  Download
                </button>
              </footer>
            </article>
          );
        })}
      </section>
      {!rows.length && (
        <EmptyState
          title="No warranties yet"
          body="Warranty records appear after you add a covered product."
        />
      )}
    </>
  );
}

export function Reports({ invoices }: { invoices: Invoice[] }) {
  const total = invoices
    .filter((invoice) => invoice.status !== "CANCELLED")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const average = invoices.length ? Math.round(total / invoices.length) : 0;
  return (
    <>
      <PageHeading
        page="reports"
        shopName="Your business"
        action={
          <Button variant="secondary" onClick={() => exportCsv(invoices)}>
            <Download size={16} />
            Export CSV
          </Button>
        }
      />
      <section className="metrics report-metrics">
        <MetricCard
          label="Revenue"
          value={formatCurrency(total)}
          trend="Across recorded invoices"
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          label="Average invoice"
          value={formatCurrency(average)}
          tone="blue"
          icon={<ReceiptText size={20} />}
        />
        <MetricCard
          label="Collection rate"
          value={invoices.length ? "100%" : "—"}
          tone="amber"
          icon={<CheckCircle2 size={20} />}
        />
      </section>
      <section className="dashboard-grid">
        <article className="panel sales-panel">
          <header>
            <div>
              <h2>Sales performance</h2>
              <p>Invoice count by month</p>
            </div>
            <BarChart3 size={20} />
          </header>
          {invoices.length ? (
            <div className="bar-chart">
              {[35, 52, 42, 71, 59, 84].map((height, index) => (
                <div key={index}>
                  <i style={{ height: `${height}%` }} />
                  <span>
                    {["Mar", "Apr", "May", "Jun", "Jul", "Aug"][index]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No report data yet"
              body="Finalise invoices to build your sales reports."
            />
          )}
        </article>
        <article className="panel top-products">
          <header>
            <div>
              <h2>Products</h2>
              <p>Highest recorded values</p>
            </div>
          </header>
          {invoices.length ? (
            invoices
              .flatMap((invoice) => invoice.items)
              .sort((a, b) => b.unitPrice - a.unitPrice)
              .slice(0, 3)
              .map((item, index) => (
                <div key={item.id} className="top-product">
                  <b>0{index + 1}</b>
                  <span className="product-avatar teal">◉</span>
                  <div>
                    <strong>{item.product}</strong>
                    <small>{item.brand || "No brand"}</small>
                  </div>
                  <em>{formatCurrency(item.unitPrice * item.quantity)}</em>
                </div>
              ))
          ) : (
            <EmptyState
              title="No products yet"
              body="Products appear after your first invoice."
            />
          )}
        </article>
      </section>
    </>
  );
}

export function ShopSettings({
  shop,
  onSave,
  toast,
}: {
  shop: Shop;
  onSave: (shop: Shop) => Promise<Shop>;
  toast: (message: string) => void;
}) {
  const [draft, setDraft] = useState(shop);
  const update = (key: keyof Shop, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <>
      <PageHeading page="settings" shopName={shop.name} />
      <section className="settings-layout">
        <article className="panel settings-card">
          <header>
            <div>
              <h2>Business details</h2>
              <p>Used in all new invoices and PDF downloads.</p>
            </div>
          </header>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const saved = await onSave(draft);
                setDraft(saved);
                toast("Shop settings saved successfully.");
              } catch (error) {
                toast(
                  error instanceof Error
                    ? error.message
                    : "Shop settings could not be saved. Please retry.",
                );
              }
            }}
          >
            <div className="form-grid">
              <label>
                Shop name
                <input
                  value={draft.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                />
              </label>
              <label>
                GSTIN
                <input
                  value={draft.gstin}
                  onChange={(event) => update("gstin", event.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label>
                Owner name
                <input
                  value={draft.owner}
                  onChange={(event) => update("owner", event.target.value)}
                  required
                />
              </label>
              <label>
                Phone number
                <input
                  value={draft.phone}
                  onChange={(event) => update("phone", event.target.value)}
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </label>
              <label className="full">
                Address
                <input
                  value={draft.address}
                  onChange={(event) => update("address", event.target.value)}
                />
              </label>
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </article>
        <article className="panel settings-aside">
          <Store size={21} />
          <h3>{draft.name}</h3>
          <p>{draft.address || "Address not added"}</p>
          <span>{draft.gstin || "No GSTIN configured"}</span>
          <small>
            Every invoice PDF uses the active shop profile. Existing invoices
            retain their recorded shop name.
          </small>
        </article>
      </section>
    </>
  );
}

export function InvoiceBuilder({
  customers,
  invoices,
  shop,
  onSave,
  onExit,
  toast,
}: {
  customers: Customer[];
  invoices: Invoice[];
  shop: Shop;
  onSave: (
    invoice: Invoice,
    customer: Customer,
  ) => Promise<{ invoice: Invoice; customer: Customer }>;
  onExit: () => void;
  toast: (message: string) => void;
}) {
  const newItem = (): InvoiceItem => ({
    id: crypto.randomUUID(),
    product: "",
    brand: "",
    model: "",
    serial: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    gst: 18,
    warrantyMonths: 12,
    warrantyEnd: addMonths(new Date().toISOString().slice(0, 10), 12),
  });
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [existing, setExisting] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([newItem()]);
  const [method, setMethod] = useState("UPI");
  const [saving, setSaving] = useState(false);
  const totals = invoiceTotals(items);
  const lookup = () => {
    const found = customers.find(
      (customer) => customer.normalizedPhone === normalisePhone(phone),
    );
    setExisting(found || null);
    if (found) {
      setName(found.name);
      setEmail(found.email || "");
      setAddress(found.address || "");
      toast(`Found ${found.name} · ${found.customerId}`);
    } else
      toast(
        normalisePhone(phone)
          ? "New customer. Add the details below."
          : "Enter a valid 10-digit mobile number.",
      );
  };
  const updateItem = (
    id: string,
    key: keyof InvoiceItem,
    value: string | number,
  ) =>
    setItems((current) =>
      current.map((item) => {
        const next = { ...item, [key]: value };
        if (key === "warrantyMonths")
          next.warrantyEnd = addMonths(
            new Date().toISOString().slice(0, 10),
            Number(value),
          );
        return next;
      }),
    );
  const create = async (status: "DRAFT" | "PAID") => {
    if (
      !normalisePhone(phone) ||
      !name.trim() ||
      !items.every(
        (item) =>
          item.product.trim() && item.quantity > 0 && item.unitPrice >= 0,
      )
    )
      return toast("Add a valid customer, product, quantity, and unit price.");
    setSaving(true);
    const customer = existing || {
      id: crypto.randomUUID(),
      customerId: generateCustomerId(),
      name: name.trim(),
      phone: normalisePhone(phone),
      normalizedPhone: normalisePhone(phone),
      email: email || undefined,
      address: address || undefined,
    };
    const prefix =
      shop.name
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 5)
        .toUpperCase() || "INV";
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      number: `${prefix}-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(6, "0")}`,
      customerId: customer.id,
      shopId: shop.id,
      shopName: shop.name,
      date: new Date().toISOString().slice(0, 10),
      status,
      paymentMethod: method,
      items,
      ...totals,
      amountPaid: status === "PAID" ? totals.total : 0,
    };
    try {
      const saved = await onSave(invoice, customer);
      if (status === "PAID") {
        downloadInvoice(saved.invoice, saved.customer, shop);
        toast(`Invoice ${saved.invoice.number} created successfully.`);
      } else toast("Draft saved successfully.");
      onExit();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "The invoice could not be saved. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="invoice-builder">
      <header className="builder-header">
        <button className="back-link" onClick={onExit}>
          <ChevronLeft size={17} />
          Invoices
        </button>
        <div>
          <h1>Create invoice</h1>
          <p>Creating an invoice for {shop.name}.</p>
        </div>
        <span className="draft-pill">Draft</span>
      </header>
      <div className="stepper">
        <Step number={1} complete={step > 1} active={step === 1}>
          Customer
        </Step>
        <i />
        <Step number={2} complete={step > 2} active={step === 2}>
          Items & warranty
        </Step>
        <i />
        <Step number={3} active={step === 3}>
          Review & payment
        </Step>
      </div>
      <div className="builder-grid">
        <div className="builder-form">
          <article className="panel">
            <header>
              <div>
                <span className="section-index">0{step}</span>
                <h2>
                  {step === 1
                    ? "Customer details"
                    : step === 2
                      ? "Products and protection"
                      : "Review your invoice"}
                </h2>
                <p>
                  {step === 1
                    ? "Phone lookup prevents accidental duplicate customers."
                    : step === 2
                      ? "Every product can have a separate warranty."
                      : "Totals are calculated securely before finalising."}
                </p>
              </div>
            </header>
            {step === 1 && (
              <div className="customer-form">
                <div className="lookup-row">
                  <label>
                    Customer mobile number
                    <input
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setExisting(null);
                      }}
                      placeholder="98765 43210"
                      inputMode="numeric"
                    />
                  </label>
                  <Button variant="secondary" type="button" onClick={lookup}>
                    <Search size={16} />
                    Find customer
                  </Button>
                </div>
                {existing && (
                  <div className="found-customer">
                    <CheckCircle2 size={18} />
                    <span>
                      <b>Existing customer found</b>
                      <small>
                        {existing.name} · <CopyId value={existing.customerId} />
                      </small>
                    </span>
                  </div>
                )}
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Customer name"
                    />
                  </label>
                  <label>
                    Email <small>Optional</small>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                    />
                  </label>
                  <label className="full">
                    Address <small>Optional</small>
                    <input
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Street, city, state"
                    />
                  </label>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="items-editor">
                {items.map((item, index) => (
                  <div className="invoice-item-editor" key={item.id}>
                    <div className="item-title">
                      <b>Item {index + 1}</b>
                      {items.length > 1 && (
                        <button
                          onClick={() =>
                            setItems((current) =>
                              current.filter((row) => row.id !== item.id),
                            )
                          }
                        >
                          <X size={16} />
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="form-grid item-grid">
                      <label className="span-2">
                        Product name
                        <input
                          value={item.product}
                          onChange={(event) =>
                            updateItem(item.id, "product", event.target.value)
                          }
                          placeholder="e.g. Product name"
                        />
                      </label>
                      <label>
                        Brand
                        <input
                          value={item.brand}
                          onChange={(event) =>
                            updateItem(item.id, "brand", event.target.value)
                          }
                          placeholder="Optional"
                        />
                      </label>
                      <label>
                        Model
                        <input
                          value={item.model}
                          onChange={(event) =>
                            updateItem(item.id, "model", event.target.value)
                          }
                          placeholder="Optional"
                        />
                      </label>
                      <label>
                        Serial number
                        <input
                          value={item.serial}
                          onChange={(event) =>
                            updateItem(item.id, "serial", event.target.value)
                          }
                          placeholder="Optional"
                        />
                      </label>
                      <label>
                        Quantity
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "quantity",
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                      <label>
                        Unit price
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice || ""}
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                      <label>
                        Discount %
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || ""}
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "discount",
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                      <label>
                        GST %
                        <select
                          value={item.gst}
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "gst",
                              Number(event.target.value),
                            )
                          }
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </label>
                    </div>
                    <div className="warranty-editor">
                      <ShieldCheck size={18} />
                      <div>
                        <b>Warranty coverage</b>
                        <p>Calculated from today’s purchase date.</p>
                      </div>
                      <label>
                        Duration
                        <select
                          value={item.warrantyMonths}
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "warrantyMonths",
                              Number(event.target.value),
                            )
                          }
                        >
                          <option value={0}>No warranty</option>
                          <option value={6}>6 months</option>
                          <option value={12}>1 year</option>
                          <option value={24}>2 years</option>
                          <option value={36}>3 years</option>
                        </select>
                      </label>
                      <span>
                        {item.warrantyMonths ? (
                          <>
                            Ends <b>{formatDate(item.warrantyEnd)}</b>
                          </>
                        ) : (
                          "No coverage"
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="add-item"
                  onClick={() => setItems((current) => [...current, newItem()])}
                >
                  <Plus size={17} />
                  Add another item
                </Button>
              </div>
            )}
            {step === 3 && (
              <div className="review-block">
                <div className="review-customer">
                  <span className="product-avatar teal">
                    {name.slice(0, 1) || "?"}
                  </span>
                  <div>
                    <b>{name || "Customer name"}</b>
                    <small>
                      {normalisePhone(phone) || "No phone"}{" "}
                      {existing?.customerId && `· ${existing.customerId}`}
                    </small>
                  </div>
                  <button onClick={() => setStep(1)}>Edit</button>
                </div>
                {items.map((item) => (
                  <div className="review-item" key={item.id}>
                    <div>
                      <b>{item.product || "Untitled product"}</b>
                      <small>
                        {item.brand} {item.model && `· ${item.model}`} ·{" "}
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </small>
                      {item.warrantyMonths > 0 && (
                        <em>
                          <ShieldCheck size={13} />
                          Covered to {formatDate(item.warrantyEnd)}
                        </em>
                      )}
                    </div>
                    <strong>
                      {formatCurrency(
                        item.quantity *
                          item.unitPrice *
                          (1 - item.discount / 100) *
                          (1 + item.gst / 100),
                      )}
                    </strong>
                  </div>
                ))}
                <div className="payment-select">
                  <label>
                    Payment method
                    <select
                      value={method}
                      onChange={(event) => setMethod(event.target.value)}
                    >
                      <option>UPI</option>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>Bank transfer</option>
                      <option>Credit</option>
                    </select>
                  </label>
                  <label>
                    Payment status
                    <select>
                      <option>Paid in full</option>
                      <option>Partially paid</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
          </article>
          <div className="builder-actions">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                Continue <ChevronRight size={16} />
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  disabled={saving}
                  onClick={() => create("DRAFT")}
                >
                  Save draft
                </Button>
                <Button disabled={saving} onClick={() => create("PAID")}>
                  {saving ? "Finalising…" : "Finalise & download"}{" "}
                  <CheckCircle2 size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
        <InvoiceSummary items={items} totals={totals} />
      </div>
    </section>
  );
}

function InvoiceSummary({
  items,
  totals,
}: {
  items: InvoiceItem[];
  totals: ReturnType<typeof invoiceTotals>;
}) {
  return (
    <aside className="invoice-summary">
      <article className="panel">
        <header>
          <h2>Invoice summary</h2>
          <span>
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </header>
        {items.map((item) => (
          <div className="summary-line" key={item.id}>
            <span>
              {item.product || "Untitled product"}
              <small>
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </small>
            </span>
            <b>{formatCurrency(item.quantity * item.unitPrice)}</b>
          </div>
        ))}
        <div className="summary-totals">
          <div>
            <span>Subtotal</span>
            <b>{formatCurrency(totals.subtotal)}</b>
          </div>
          <div>
            <span>Item discounts</span>
            <b>− {formatCurrency(totals.discount)}</b>
          </div>
          <div>
            <span>GST</span>
            <b>{formatCurrency(totals.tax)}</b>
          </div>
          <div className="summary-grand">
            <span>Total payable</span>
            <strong>{formatCurrency(totals.total)}</strong>
          </div>
        </div>
        <small className="tax-note">
          Tax is recalculated on finalisation. GST treatment depends on the
          customer’s state.
        </small>
      </article>
    </aside>
  );
}
function PageHeading({
  page,
  shopName,
  action,
}: {
  page: keyof typeof titles;
  shopName: string;
  action?: React.ReactNode;
}) {
  const [title, description] = titles[page];
  return (
    <section className="page-heading">
      <div>
        <p className="overline">{shopName.toUpperCase()}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </section>
  );
}
function exportCsv(invoices: Invoice[]) {
  const text = [
    "Invoice,Date,Amount,Status",
    ...invoices.map(
      (invoice) =>
        `${invoice.number},${invoice.date},${invoice.total},${invoice.status}`,
    ),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "billnest-invoices.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadInvoice(
  invoice: Invoice,
  customer?: Customer,
  shop?: Shop,
) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const left = 44;
  const right = width - 44;
  const name = shop?.name || invoice.shopName || "BillNest Shop";
  const profile = shop || { address: "", phone: "", email: "", gstin: "" };
  const header = () => {
    pdf.setFillColor(13, 107, 93);
    pdf.rect(0, 0, width, 108, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(25);
    pdf.text(name, left, 48, { maxWidth: 330 });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("GST INVOICE", left, 70);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("INVOICE", right, 48, { align: "right" });
    pdf.setFontSize(9);
    pdf.text(invoice.number, right, 70, { align: "right" });
  };
  const footer = (page: number) => {
    pdf.setDrawColor(220, 230, 227);
    pdf.line(left, height - 42, right, height - 42);
    pdf.setTextColor(102, 119, 112);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      "Thank you for your business. Keep this invoice for your records.",
      left,
      height - 26,
    );
    pdf.text(`Page ${page}`, right, height - 26, { align: "right" });
  };
  let page = 1;
  header();
  let y = 142;
  pdf.setTextColor(25, 43, 38);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("BILL FROM", left, y);
  pdf.text("BILL TO", 334, y);
  pdf.setFontSize(12);
  pdf.text(name, left, y + 19);
  pdf.text(customer?.name || "Customer", 334, y + 19);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const shopInfo = [
    profile.address,
    profile.phone,
    profile.email,
    profile.gstin ? `GSTIN: ${profile.gstin}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const customerInfo = [
    customer?.customerId || "",
    customer?.phone || "",
    customer?.email || "",
    customer?.address || "",
  ]
    .filter(Boolean)
    .join("\n");
  pdf.text(shopInfo || "Shop contact details not added", left, y + 37, {
    maxWidth: 220,
    lineHeightFactor: 1.45,
  });
  pdf.text(customerInfo || "Customer details not added", 334, y + 37, {
    maxWidth: 200,
    lineHeightFactor: 1.45,
  });
  y = 250;
  const tableHeader = () => {
    pdf.setFillColor(239, 246, 244);
    pdf.rect(left, y, right - left, 25, "F");
    pdf.setTextColor(23, 43, 38);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("DESCRIPTION", left + 9, y + 16);
    pdf.text("QTY", 358, y + 16, { align: "right" });
    pdf.text("GST", 407, y + 16, { align: "right" });
    pdf.text("AMOUNT", right - 9, y + 16, { align: "right" });
    y += 42;
  };
  tableHeader();
  pdf.setFont("helvetica", "normal");
  invoice.items.forEach((item) => {
    const details = [
      item.brand,
      item.model,
      item.serial ? `Serial: ${item.serial}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const description = pdf.splitTextToSize(item.product, 245);
    const detailLines = details ? pdf.splitTextToSize(details, 245) : [];
    const rowHeight = Math.max(
      42,
      (description.length + detailLines.length) * 11 + 17,
    );
    if (y + rowHeight > height - 165) {
      footer(page);
      pdf.addPage();
      page += 1;
      header();
      y = 136;
      tableHeader();
    }
    const amount =
      item.quantity *
      item.unitPrice *
      (1 - item.discount / 100) *
      (1 + item.gst / 100);
    pdf.setTextColor(25, 43, 38);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(description, left + 9, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(90, 107, 101);
    pdf.setFontSize(8);
    if (detailLines.length)
      pdf.text(detailLines, left + 9, y + description.length * 11 + 2);
    pdf.setTextColor(25, 43, 38);
    pdf.setFontSize(9);
    pdf.text(String(item.quantity), 358, y, { align: "right" });
    pdf.text(`${item.gst}%`, 407, y, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text(money(amount), right - 9, y, { align: "right" });
    pdf.setDrawColor(226, 234, 231);
    pdf.line(left, y + rowHeight - 14, right, y + rowHeight - 14);
    y += rowHeight;
  });
  if (y > height - 242) {
    footer(page);
    pdf.addPage();
    page += 1;
    header();
    y = 145;
  }
  y += 8;
  const totalLeft = 353;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(65, 82, 76);
  pdf.setFontSize(10);
  [
    ["Subtotal", invoice.subtotal],
    ["Discount", -invoice.discount],
    ["GST", invoice.tax],
  ].forEach(([label, amount]) => {
    pdf.text(String(label), totalLeft, y);
    pdf.text(money(Number(amount)), right, y, { align: "right" });
    y += 21;
  });
  pdf.setFillColor(13, 107, 93);
  pdf.rect(totalLeft - 10, y - 5, right - totalLeft + 10, 42, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(
    invoice.status === "PARTIALLY_PAID" ? "TOTAL DUE" : "TOTAL PAID",
    totalLeft,
    y + 12,
  );
  pdf.setFontSize(15);
  pdf.text(money(invoice.total), right - 10, y + 27, { align: "right" });
  y += 72;
  if (invoice.items.some((item) => item.warrantyMonths)) {
    pdf.setTextColor(25, 43, 38);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Warranty coverage", left, y);
    y += 17;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    invoice.items
      .filter((item) => item.warrantyMonths)
      .forEach((item) => {
        pdf.text(
          `${item.product}: protected until ${formatDate(item.warrantyEnd)} (${item.warrantyMonths} months)`,
          left,
          y,
          { maxWidth: right - left },
        );
        y += 15;
      });
  }
  footer(page);
  pdf.save(`${invoice.number}.pdf`);
}
function downloadWarranty(
  item: InvoiceItem,
  invoice: Invoice,
  customer?: Customer,
  shop?: Shop,
) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const right = 547;
  pdf.setFillColor(13, 107, 93);
  pdf.rect(0, 0, 595, 108, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(25);
  pdf.text("Warranty certificate", left, 54);
  pdf.setFontSize(10);
  pdf.text(shop?.name || invoice.shopName, left, 77);
  pdf.setTextColor(25, 43, 38);
  pdf.setFontSize(11);
  pdf.text("Covered product", left, 150);
  pdf.setFontSize(19);
  pdf.text(item.product, left, 179, { maxWidth: 460 });
  const rows = [
    ["Customer", customer?.name || "Customer"],
    ["Invoice", invoice.number],
    ["Shop", shop?.name || invoice.shopName],
    ["Model", item.model || "Not provided"],
    ["Serial number", item.serial || "Not provided"],
    ["Purchase date", formatDate(invoice.date)],
    ["Coverage ends", formatDate(item.warrantyEnd)],
    ["Warranty duration", `${item.warrantyMonths} months`],
  ];
  let y = 230;
  rows.forEach(([label, value]) => {
    pdf.setTextColor(102, 119, 112);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(label, left, y);
    pdf.setTextColor(25, 43, 38);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, 210, y, { maxWidth: 310 });
    y += 32;
  });
  pdf.setDrawColor(220, 230, 227);
  pdf.line(left, 770, right, 770);
  pdf.setTextColor(102, 119, 112);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    "This is a digital warranty record. Coverage is subject to the provider terms.",
    left,
    788,
  );
  pdf.save(`warranty-${item.product.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
