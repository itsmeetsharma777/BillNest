# BillNest

BillNest is a responsive GST billing and warranty-management application. It starts with no seeded customers, shops, invoices, or personal data.

## Start locally

```bash
npm install
cp .env.example .env
npm run db:indexes
npm run dev
```

Open `http://localhost:5173`. The frontend is served by Vite and the API is served on port `4000`. Until MongoDB Atlas is configured, the app permits an explicitly labelled empty browser-only preview; no claim is made that it is synced.

Detailed Atlas steps are in [`docs/mongodb-atlas.md`](docs/mongodb-atlas.md). The data model is in [`db/mongodb.md`](db/mongodb.md).

## Verification

```bash
npm run build
npm test
npm run test:smoke
```

See [`docs/testing.md`](docs/testing.md) for the unit, integration, smoke, system, acceptance, white-box, and black-box QA record.

## Security design

- MongoDB-backed accounts use bcrypt password hashes, `HttpOnly` session cookies, rate limiting, Helmet headers, role checks, and CSRF header/cookie validation for protected mutations.
- Invoices are scoped server-side to the authenticated shop or customer. A public customer ID or invoice number is never an authorization credential.
- The server recalculates product totals in integer paise, creates unpredictable customer IDs, and records audit events without storing raw IP addresses.
- The API persists shop registration, login sessions, shop settings, and invoices once Atlas is connected. Upload/OCR and email provider values remain deliberately unconfigured until those external services are chosen.

## PDF invoices

Invoice downloads use an A4 layout with fixed margins, right-aligned amounts, wrapped product descriptions, multi-page item handling, and `INR` text so the built-in PDF font does not corrupt the rupee symbol. Every new invoice uses the active shop profile rather than a hard-coded business name.
