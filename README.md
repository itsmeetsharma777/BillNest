# BillNest

A polished, responsive BillNest web application for Indian GST billing and warranty management. The included Vite client is a fully interactive local development experience with role-specific workspaces, browser-persisted development data, PDF invoices, warranty certificates, CSV reporting, customer lookup, and a review-first OCR mock flow.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Select either role on the landing page; development data is seeded automatically and persists in local storage. Clear the `billnest-*` local-storage keys to restore the initial records.

```bash
npm run build
npm test
```

## Product highlights

- Separate shopkeeper and customer journeys with role-specific navigation.
- E.164 phone normalization via `libphonenumber-js` and one permanent, public `CUS-XXXXXXXX` identifier per phone.
- Multi-shop-safe data model: a global customer identity never grants a shop access to another shop’s invoices.
- Draft/finalised invoice flow, backend-aligned totals, warranty expiry calculation, A4 PDF invoice and warranty certificate download.
- Private-by-design online-purchase upload flow: file validation, processing state, edit-before-save extraction review, and no claim of a live external OCR provider.
- Responsive pages with loading, empty, success, filtering, cancellation confirmation, notification, and error feedback states.

## Production architecture

The user interface is intentionally decoupled from infrastructure. `db/schema.sql` is the PostgreSQL migration baseline; [`docs/api.md`](docs/api.md) defines the REST boundary to put behind a Node/TypeScript service (Fastify, Express, or Next route handlers).

For deployment, use PostgreSQL, private S3-compatible object storage with short-lived signed URLs, a server-only OCR provider adapter, an email provider, and a scheduled warranty-reminder worker. Keep `AUTH_SECRET`, database, storage, OCR, and email credentials in environment variables as shown in `.env.example`.

### Security decisions

- Hash passwords with Argon2id at the API boundary; never store or log them.
- Use server-side sessions, secure cookies, CSRF protection, rate limits, and role checks.
- Recalculate currency in integer paise server-side; never accept client totals.
- Create customers inside a transaction with `UNIQUE(normalized_phone)` and retry/find-existing after a conflict.
- Snapshot shop and customer details on invoice finalisation, status-cancel instead of deleting final invoices, and append audit events.
- Validate upload MIME types/size before issuing a private storage upload URL; scan uploads asynchronously before OCR.

## OCR integration

The UI deliberately implements a clearly labelled development extraction flow. A production `InvoiceOCRService` should expose `extract(documentKey): ExtractedInvoice` and live only on the server. It can be backed by Google Cloud Vision, AWS Textract, or Azure Document Intelligence without changing customer-facing screens. OCR output is always provisional: the customer reviews and corrects it before saving.

## Database and API

Apply `db/schema.sql` through your migration runner against PostgreSQL. It includes foreign keys, check constraints, E.164 uniqueness, unpredictable permanent customer IDs, per-shop invoice uniqueness, immutable invoice snapshots, indexes, notification de-duplication, and audit logging.

See [`docs/api.md`](docs/api.md) for the endpoint contract and the key multi-tenancy authorization invariant.
