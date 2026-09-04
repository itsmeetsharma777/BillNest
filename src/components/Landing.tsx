import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  ChevronDown,
  FileText,
  LockKeyhole,
  ScanText,
  ShieldCheck,
  Store,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { Button, Logo } from "./ui";
import type { Role } from "../types";

export interface AuthSubmission {
  fullName: string;
  shopName: string;
  shopAddress: string;
  contact: string;
  email: string;
  password: string;
}

export function Landing({
  onAuth,
}: {
  onAuth: (mode: "login" | "register", role: Role) => void;
}) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav>
          <a href="#how-it-works">How it works</a>
          <a href="#for-business">For business</a>
          <a href="#for-customers">For customers</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div>
          <Button variant="ghost" onClick={() => onAuth("login", "shopkeeper")}>
            Log in
          </Button>
          <Button onClick={() => onAuth("register", "shopkeeper")}>
            Get started <ArrowRight size={16} />
          </Button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span>✦</span> BUILT FOR MODERN COMMERCE
            </p>
            <h1>
              Billing that keeps
              <br />
              <em>its promise.</em>
            </h1>
            <p className="hero-body">
              A calmer way to create invoices, protect every warranty, and give
              customers a purchase history they’ll actually use.
            </p>
            <div className="hero-actions">
              <Button onClick={() => onAuth("register", "shopkeeper")}>
                Create shopkeeper account <ArrowRight size={17} />
              </Button>
              <Button
                variant="secondary"
                onClick={() => onAuth("register", "customer")}
              >
                I’m a customer
              </Button>
            </div>
            <div className="hero-proof">
              <div className="avatars">
                <span>•</span>
                <span>•</span>
                <span>•</span>
                <span>•</span>
              </div>
              <p>
                <b>Private by design.</b>
                <br />
                Built by Meet Sharma.
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="glow" />
            <div className="invoice-preview">
              <div className="preview-head">
                <Logo />
                <span>
                  PAID <Check size={12} />
                </span>
              </div>
              <p className="preview-label">INVOICE TO</p>
              <h3>A valued customer</h3>
              <p>CUS-XXXXXXXX</p>
              <div className="preview-line">
                <span>
                  Premium purchase
                  <br />
                  <small>Protected product</small>
                </span>
                <b>INR 94,388</b>
              </div>
              <div className="preview-total">
                <span>Total paid</span>
                <strong>INR 94,388</strong>
              </div>
              <div className="warranty-pill">
                <ShieldCheck size={16} />
                <span>
                  <b>Warranty protection included</b>
                  <small>One active warranty</small>
                </span>
                <ArrowRight size={15} />
              </div>
            </div>
            <div className="floating-card card-one">
              <BellRing size={18} />
              <span>
                <b>Warranty reminder</b>
                <small>Protection ends in 7 days</small>
              </span>
            </div>
            <div className="floating-card card-two">
              <BadgeCheck size={18} />
              <span>
                <b>Invoice delivered</b>
                <small>Everything in one place</small>
              </span>
            </div>
          </div>
        </section>
        <section className="trust-row">
          <span>DESIGNED FOR EVERY KIND OF SALE</span>
          <b>Retail</b>
          <b>Electronics</b>
          <b>Home & living</b>
          <b>Accessories</b>
          <b>Local business</b>
        </section>
        <section className="intro-section" id="how-it-works">
          <p className="eyebrow">ONE HOME FOR EVERY RECEIPT</p>
          <h2>Less paper. More peace of mind.</h2>
          <p>
            BillNest connects the moment of sale with the months and years that
            follow it.
          </p>
          <div className="three-steps">
            <article>
              <span>01</span>
              <h3>Create with confidence</h3>
              <p>
                Build clear, GST-ready invoices with products, serial numbers,
                and payment details.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Protection stays attached</h3>
              <p>
                Warranty dates live with each product—never lost in a drawer or
                a chat thread.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Customers stay informed</h3>
              <p>
                Customers can find bills and get timely warranty reminders from
                their own portal.
              </p>
            </article>
          </div>
        </section>
        <section className="feature-block" id="for-business">
          <div className="feature-window shop-window">
            <div className="window-bar">
              <i />
              <i />
              <i />
              <b>Your shop dashboard</b>
            </div>
            <div className="window-body">
              <div className="mini-side">
                <span className="mini-logo">B</span>
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="mini-main">
                <p>
                  Your business overview <span>Today</span>
                </p>
                <div className="mini-stats">
                  <b>
                    —<small>No sales yet</small>
                  </b>
                  <b>
                    —<small>Invoices</small>
                  </b>
                  <b>
                    —<small>Warranties</small>
                  </b>
                </div>
                <div className="mini-chart">
                  <span>Sales overview</span>
                  <svg viewBox="0 0 300 90" preserveAspectRatio="none">
                    <path
                      d="M0 74 C30 60, 40 65, 65 42 S105 53, 132 33 S180 39, 195 24 S243 48, 300 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="feature-copy">
            <p className="eyebrow">FOR SHOPKEEPERS</p>
            <h2>Every sale, exceptionally organised.</h2>
            <p>
              Make every checkout more professional, while warranty data and
              customer records stay effortless behind the scenes.
            </p>
            <ul>
              <li>
                <Check size={16} /> GST-ready, printable invoices
              </li>
              <li>
                <Check size={16} /> One customer ID across all shops
              </li>
              <li>
                <Check size={16} /> Sales, payments, and warranty insights
              </li>
            </ul>
            <Button onClick={() => onAuth("register", "shopkeeper")}>
              Start billing smarter <ArrowRight size={16} />
            </Button>
          </div>
        </section>
        <section className="customer-section" id="for-customers">
          <div className="feature-copy">
            <p className="eyebrow">FOR CUSTOMERS</p>
            <h2>
              Every purchase,
              <br />
              right where you need it.
            </h2>
            <p>
              Your bills, uploaded receipts, and warranties in one quiet, secure
              place. No more chasing paper invoices.
            </p>
            <ul>
              <li>
                <Check size={16} /> Keep store and online purchases together
              </li>
              <li>
                <Check size={16} /> Know what’s protected and for how long
              </li>
              <li>
                <Check size={16} /> Download documents whenever you need them
              </li>
            </ul>
            <Button
              variant="secondary"
              onClick={() => onAuth("register", "customer")}
            >
              Create customer account <ArrowRight size={16} />
            </Button>
          </div>
          <div className="phone-preview">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="phone-title">
                <Logo compact />
                <BellRing size={16} />
              </div>
              <small>YOUR BILLNEST</small>
              <h3>
                Your account <span>✦</span>
              </h3>
              <div className="phone-stats">
                <b>
                  —<small>Purchases</small>
                </b>
                <b>
                  —<small>Warranties</small>
                </b>
              </div>
              <p className="phone-label">NEEDS ATTENTION</p>
              <div className="phone-alert">
                <BellRing size={17} />
                <span>
                  <b>Warranty ends soon</b>
                  <small>Your product · 7 days left</small>
                </span>
                <ChevronDown size={15} />
              </div>
              <p className="phone-label">RECENT PURCHASES</p>
              <div className="phone-item">
                <span>◉</span>
                <b>
                  Recent purchase<small>Saved securely in BillNest</small>
                </b>
                <em>Protected</em>
              </div>
            </div>
          </div>
        </section>
        <section className="security-row">
          <LockKeyhole size={25} />
          <div>
            <b>Your records are yours.</b>
            <p>
              BillNest is built around private accounts and role-based access. A
              shop only sees its own sales; customers see only their own
              purchases.
            </p>
          </div>
        </section>
        <section className="faq" id="faq">
          <p className="eyebrow">GOOD QUESTIONS</p>
          <h2>Simple by design.</h2>
          <div>
            {[
              [
                "Does a customer need an account to receive an invoice?",
                "Shops can create an invoice with a customer’s phone number. When the customer creates an account with the same verified phone number, their purchase history is ready for them.",
              ],
              [
                "How are customers identified across different shops?",
                "Each phone number maps to one permanent, non-sequential customer ID. Shops only see the purchases made with their own shop.",
              ],
              [
                "Can I upload invoices from online stores?",
                "Yes. Upload a PDF or image, review the extracted information, and save the purchase with its warranty details.",
              ],
              [
                "What happens when a warranty is about to expire?",
                "You will receive an in-app reminder according to your notification preferences.",
              ],
            ].map(([question, answer], index) => (
              <details key={question} open={index === 0}>
                <summary>
                  {question}
                  <ChevronDown size={18} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <p className="eyebrow">A BETTER AFTER-SALE EXPERIENCE</p>
          <h2>
            Make every bill
            <br />
            <em>mean more.</em>
          </h2>
          <p>Start building lasting customer confidence today.</p>
          <div>
            <Button onClick={() => onAuth("register", "shopkeeper")}>
              Create shopkeeper account <ArrowRight size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => onAuth("login", "customer")}
            >
              Customer login
            </Button>
          </div>
        </section>
      </main>
      <footer>
        <Logo />
        <span>© 2026 BillNest. Built by Meet Sharma.</span>
        <nav>
          <a href="mailto:meetsharma0702@gmail.com?subject=BillNest%20support">
            Support: Meet Sharma
          </a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#faq">Help center</a>
        </nav>
      </footer>
    </div>
  );
}

export function AuthScreen({
  mode,
  role,
  onBack,
  onSubmit,
  onRole,
}: {
  mode: "login" | "register";
  role: Role;
  onBack: () => void;
  onSubmit: (details: AuthSubmission) => Promise<void>;
  onRole: (role: Role) => void;
}) {
  const register = mode === "register";
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password") || "");
    if (register && password !== String(fields.get("confirmPassword") || ""))
      return setError("Passwords do not match.");
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        fullName: String(fields.get("fullName") || ""),
        shopName: String(fields.get("shopName") || ""),
        shopAddress: String(fields.get("shopAddress") || ""),
        contact: String(fields.get("contact") || ""),
        email: String(fields.get("email") || ""),
        password,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to continue. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const changeRole = (nextRole: Role) => {
    setError("");
    onRole(nextRole);
  };
  return (
    <div className="auth-page">
      <div className="auth-side">
        <Logo />
        <div>
          <p className="eyebrow">
            {role === "shopkeeper" ? "FOR YOUR BUSINESS" : "FOR YOUR PURCHASES"}
          </p>
          <h1>
            {role === "shopkeeper"
              ? "Your best after-sale experience starts here."
              : "A home for every promise you bought."}
          </h1>
          <p>
            {role === "shopkeeper"
              ? "Turn a sale into a reason customers return."
              : "Keep every purchase and warranty within reach."}
          </p>
        </div>
        <div className="auth-side-bottom">
          <ShieldCheck size={18} />
          Private by default. Built for the long run.
        </div>
      </div>
      <div className="auth-form-wrap">
        <button className="back-link" onClick={onBack}>
          ← Back to home
        </button>
        <section className="auth-card">
          <div className="role-toggle">
            <button
              className={role === "shopkeeper" ? "selected" : ""}
              type="button"
              onClick={() => changeRole("shopkeeper")}
            >
              <Store size={17} />
              Shopkeeper
            </button>
            <button
              className={role === "customer" ? "selected" : ""}
              type="button"
              onClick={() => changeRole("customer")}
            >
              <UserRound size={17} />
              Customer
            </button>
          </div>
          <h2>{register ? "Create your account" : "Welcome back"}</h2>
          <p>
            {register
              ? `Set up your ${role === "shopkeeper" ? "shop" : "purchase"} space in a few minutes.`
              : "Sign in to continue to your workspace."}
          </p>
          <form onSubmit={submit}>
            <div className="form-grid">
              {register && (
                <label>
                  Full name
                  <input
                    name="fullName"
                    required
                    placeholder={
                      role === "shopkeeper"
                        ? "Shop owner name"
                        : "Your full name"
                    }
                  />
                </label>
              )}
              {register && role === "shopkeeper" && (
                <label>
                  Shop name
                  <input
                    name="shopName"
                    required
                    placeholder="Your shop name"
                  />
                </label>
              )}
              <label>
                {register && role === "shopkeeper"
                  ? "Phone number"
                  : role === "customer"
                    ? "Phone number"
                    : "Email or phone number"}
                <input
                  name="contact"
                  required
                  type={register || role === "customer" ? "tel" : "text"}
                  placeholder={
                    register || role === "customer"
                      ? "+91 98765 43210"
                      : "you@example.com"
                  }
                />
              </label>
              {register && (
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                  />
                </label>
              )}
              {register && role === "shopkeeper" && (
                <label className="full">
                  Shop address
                  <input
                    name="shopAddress"
                    required
                    placeholder="Street, city, state, pincode"
                  />
                </label>
              )}
              <label>
                Password
                <input
                  name="password"
                  required
                  type="password"
                  minLength={8}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder="At least 8 characters"
                />
              </label>
              {register && (
                <label>
                  Confirm password
                  <input
                    name="confirmPassword"
                    required
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                  />
                </label>
              )}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {register && (
              <label className="check-line">
                <input type="checkbox" required />I agree to the Terms and
                Privacy Policy.
              </label>
            )}
            <Button type="submit" className="wide" disabled={submitting}>
              {submitting
                ? "Please wait…"
                : register
                  ? `Create ${role === "shopkeeper" ? "shopkeeper" : "customer"} account`
                  : "Log in"}{" "}
              <ArrowRight size={16} />
            </Button>
          </form>
          {!register && (
            <button className="text-button" type="button">
              Forgot password?
            </button>
          )}
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to BillNest?"}{" "}
            <button type="button" onClick={onBack}>
              {register ? "Log in" : "Create an account"}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
