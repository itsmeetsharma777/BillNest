import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Landing, AuthScreen, type AuthSubmission } from "./components/Landing";
import { AppShell, type ThemePreference, type View } from "./components/Layout";
import {
  CustomerDashboard,
  CustomerSettings,
  Documents,
  NotificationsPanel,
  Purchases,
  UploadPurchase,
} from "./components/CustomerViews";
import {
  Customers,
  InvoiceBuilder,
  Reports,
  ShopDashboard,
  ShopInvoices,
  ShopSettings,
  Warranties,
} from "./components/ShopViews";
import {
  authenticate,
  createInvoice,
  endSession,
  fetchInvoices,
  isApiUnavailable,
  updateShop,
} from "./lib/api";
import type { Customer, Invoice, Notification, Role, Shop } from "./types";

type Screen = "landing" | "auth" | "app";
type Session = {
  role: Role;
  profileName: string;
  shop?: Shop;
  customer?: Customer;
  backend?: boolean;
};
const storageVersion = "billnest-v4";

const load = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value));
const resolvedTheme = (preference: ThemePreference) =>
  preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : preference;

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [role, setRole] = useState<Role>("shopkeeper");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [view, setView] = useState<View>("dashboard");
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    load(`${storageVersion}-invoices`, []),
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    load(`${storageVersion}-customers`, []),
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    load(`${storageVersion}-notifications`, []),
  );
  const [session, setSession] = useState<Session | null>(() =>
    load(`${storageVersion}-session`, null),
  );
  const [theme, setTheme] = useState<ThemePreference>(() =>
    load("billnest-theme", "system"),
  );
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!localStorage.getItem(`${storageVersion}-clean-start`)) {
      [
        "billnest-invoices",
        "billnest-customers",
        "billnest-notifications",
        "billnest-v3-invoices",
        "billnest-v3-customers",
        "billnest-v3-notifications",
        "billnest-v3-session",
      ].forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(`${storageVersion}-clean-start`, "true");
    }
  }, []);
  useEffect(() => {
    save(`${storageVersion}-invoices`, invoices);
  }, [invoices]);
  useEffect(() => {
    save(`${storageVersion}-customers`, customers);
  }, [customers]);
  useEffect(() => {
    save(`${storageVersion}-notifications`, notifications);
  }, [notifications]);
  useEffect(() => {
    save(`${storageVersion}-session`, session);
  }, [session]);
  useEffect(() => {
    save("billnest-theme", theme);
    document.documentElement.dataset.theme = resolvedTheme(theme);
  }, [theme]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      if (theme === "system")
        document.documentElement.dataset.theme = resolvedTheme("system");
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openAuth = (mode: "login" | "register", nextRole: Role) => {
    setAuthMode(mode);
    setRole(nextRole);
    setScreen("auth");
  };
  const signIn = async (details: AuthSubmission) => {
    const profileName =
      details.fullName.trim() ||
      (role === "shopkeeper" ? "Shop owner" : "Customer");
    try {
      const signedIn = await authenticate(authMode, role, details);
      const nextSession: Session =
        role === "shopkeeper"
          ? {
              role,
              profileName: signedIn.profileName,
              shop: signedIn.shop!,
              backend: true,
            }
          : {
              role,
              profileName: signedIn.profileName,
              customer: signedIn.customer!,
              backend: true,
            };
      setSession(nextSession);
      try {
        setInvoices(await fetchInvoices());
      } catch {
        setInvoices([]);
      }
      setScreen("app");
      setView("dashboard");
      setToast("Signed in securely. Your workspace is connected to MongoDB.");
      return;
    } catch (error) {
      if (!isApiUnavailable(error)) throw error;
    }
    if (role === "shopkeeper") {
      const createdShop: Shop = {
        id: crypto.randomUUID(),
        name: details.shopName.trim() || "My Shop",
        owner: profileName,
        phone: details.contact || "",
        email: details.email || "",
        address: details.shopAddress || "",
        state: "",
        gstin: "",
      };
      setSession({ role, profileName, shop: createdShop });
      setScreen("app");
      setView("dashboard");
      setToast(
        "Atlas is not connected yet. This empty preview stays only in this browser.",
      );
    } else {
      const customer: Customer = {
        id: crypto.randomUUID(),
        customerId: "CUS-LOCAL",
        name: profileName,
        phone: details.contact,
        normalizedPhone: details.contact,
        email: details.email || undefined,
        address: details.shopAddress || undefined,
      };
      setCustomers((current) => [...current, customer]);
      setSession({ role, profileName, customer });
      setScreen("app");
      setView("dashboard");
      setToast(
        "Atlas is not connected yet. This empty preview stays only in this browser.",
      );
    }
  };
  const logout = () => {
    if (session?.backend) void endSession().catch(() => undefined);
    setSession(null);
    setScreen("landing");
    setView("dashboard");
    setToast("You have been logged out safely.");
  };
  const activeShop = session?.shop;
  const activeCustomer = session?.customer;
  const shopInvoices = invoices.filter(
    (invoice) => invoice.shopId === activeShop?.id,
  );
  const myInvoices = invoices.filter(
    (invoice) => invoice.customerId === activeCustomer?.id,
  );
  const addShopInvoice = (invoice: Invoice, customer: Customer) => {
    setCustomers((current) =>
      current.some((item) => item.id === customer.id)
        ? current
        : [...current, customer],
    );
    setInvoices((current) => [invoice, ...current]);
    setNotifications((current) => [
      {
        id: crypto.randomUUID(),
        title: "Invoice created",
        description: `${invoice.number} is ready to download or print.`,
        date: "Just now",
        read: false,
        type: "invoice",
      },
      ...current,
    ]);
    if (session?.backend)
      void createInvoice(invoice, customer)
        .then((saved) => {
          setCustomers((current) =>
            current.some((item) => item.id === saved.customer.id)
              ? current
              : [...current, saved.customer],
          );
          setInvoices((current) =>
            current.map((item) =>
              item.id === invoice.id ? saved.invoice : item,
            ),
          );
        })
        .catch(() =>
          setToast(
            "The bill was downloaded, but MongoDB could not save it. Please try again.",
          ),
        );
  };
  const addOnlineInvoice = (invoice: Invoice) => {
    setInvoices((current) => [invoice, ...current]);
    setNotifications((current) => [
      {
        id: crypto.randomUUID(),
        title: "Purchase added",
        description: `${invoice.items[0].product} has been saved with its warranty details.`,
        date: "Just now",
        read: false,
        type: "upload",
      },
      ...current,
    ]);
  };
  const unread = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const setShop = (shop: Shop) => {
    setSession((current) =>
      current ? { ...current, shop, profileName: shop.owner } : current,
    );
    if (session?.backend)
      void updateShop(shop)
        .then((saved) =>
          setSession((current) =>
            current
              ? { ...current, shop: saved, profileName: saved.owner }
              : current,
          ),
        )
        .catch(() =>
          setToast(
            "Saved locally, but MongoDB could not be updated. Please retry.",
          ),
        );
  };

  if (screen === "landing")
    return (
      <>
        <Landing onAuth={openAuth} />
        <Toast message={toast} onClose={() => setToast("")} />
      </>
    );
  if (screen === "auth")
    return (
      <>
        <AuthScreen
          mode={authMode}
          role={role}
          onBack={() => setScreen("landing")}
          onRole={setRole}
          onSubmit={signIn}
        />
        <Toast message={toast} onClose={() => setToast("")} />
      </>
    );
  if (
    !session ||
    (session.role === "shopkeeper" && !activeShop) ||
    (session.role === "customer" && !activeCustomer)
  )
    return null;
  const workspaceName =
    session.role === "shopkeeper" ? activeShop!.name : activeCustomer!.name;
  return (
    <>
      <AppShell
        role={session.role}
        view={view}
        onView={setView}
        onLogout={logout}
        notifications={unread}
        workspaceName={workspaceName}
        profileName={session.profileName}
        theme={theme}
        onThemeChange={setTheme}
      >
        {session.role === "shopkeeper" ? (
          <ShopContent
            view={view}
            invoices={shopInvoices}
            customers={customers}
            shop={activeShop!}
            setShop={setShop}
            setInvoices={(next) =>
              setInvoices((current) => [
                ...next,
                ...current.filter(
                  (invoice) => invoice.shopId !== activeShop!.id,
                ),
              ])
            }
            onView={setView}
            toast={setToast}
            onSave={addShopInvoice}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        ) : (
          <CustomerContent
            view={view}
            invoices={myInvoices}
            customer={activeCustomer!}
            onView={setView}
            notifications={notifications}
            setNotifications={setNotifications}
            toast={setToast}
            onCreate={addOnlineInvoice}
          />
        )}
      </AppShell>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

function ShopContent({
  view,
  invoices,
  customers,
  shop,
  setShop,
  setInvoices,
  onView,
  toast,
  onSave,
  notifications,
  setNotifications,
}: {
  view: View;
  invoices: Invoice[];
  customers: Customer[];
  shop: Shop;
  setShop: (shop: Shop) => void;
  setInvoices: (invoices: Invoice[]) => void;
  onView: (view: View) => void;
  toast: (message: string) => void;
  onSave: (invoice: Invoice, customer: Customer) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
}) {
  if (view === "create-invoice")
    return (
      <InvoiceBuilder
        customers={customers}
        invoices={invoices}
        shop={shop}
        onSave={onSave}
        onExit={() => onView("invoices")}
        toast={toast}
      />
    );
  if (view === "invoices")
    return (
      <ShopInvoices
        invoices={invoices}
        customers={customers}
        shop={shop}
        setInvoices={setInvoices}
        toast={toast}
      />
    );
  if (view === "customers")
    return (
      <Customers
        invoices={invoices}
        customers={customers}
        shopName={shop.name}
      />
    );
  if (view === "warranties")
    return <Warranties invoices={invoices} customers={customers} shop={shop} />;
  if (view === "reports") return <Reports invoices={invoices} />;
  if (view === "settings")
    return <ShopSettings shop={shop} onSave={setShop} toast={toast} />;
  if (view === "notifications")
    return (
      <NotificationsPanel
        notifications={notifications}
        setNotifications={setNotifications}
      />
    );
  return (
    <ShopDashboard
      invoices={invoices}
      customers={customers}
      shop={shop}
      onView={onView}
    />
  );
}

function CustomerContent({
  view,
  invoices,
  customer,
  onView,
  notifications,
  setNotifications,
  toast,
  onCreate,
}: {
  view: View;
  invoices: Invoice[];
  customer: Customer;
  onView: (view: View) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  toast: (message: string) => void;
  onCreate: (invoice: Invoice) => void;
}) {
  if (view === "purchases")
    return <Purchases invoices={invoices} customer={customer} />;
  if (view === "warranties")
    return (
      <Warranties invoices={invoices} customers={[customer]} customerMode />
    );
  if (view === "upload")
    return (
      <UploadPurchase customer={customer} onCreate={onCreate} toast={toast} />
    );
  if (view === "documents")
    return <Documents invoices={invoices} customer={customer} />;
  if (view === "settings")
    return <CustomerSettings customer={customer} toast={toast} />;
  if (view === "notifications")
    return (
      <NotificationsPanel
        notifications={notifications}
        setNotifications={setNotifications}
      />
    );
  return (
    <CustomerDashboard
      invoices={invoices}
      customer={customer}
      onView={onView}
    />
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={18} />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  );
}
