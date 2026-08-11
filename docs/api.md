# BillNest API contract

All endpoints return `{ "data": ... }` on success and `{ "error": { "code", "message", "requestId" } }` on failure. Protected endpoints use a secure, `HttpOnly`, `SameSite=Lax` session cookie and require a CSRF token on mutations.

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `POST /v1/auth/register/customer` | Public, rate limited | Creates the user and one global customer identity from the E.164 phone. |
| `POST /v1/auth/register/shopkeeper` | Public, rate limited | Creates a shopkeeper user and their first shop. |
| `POST /v1/auth/login` | Public, rate limited | Validates role-specific credentials and starts a session. |
| `POST /v1/auth/logout` | Session | Invalidates the current session. |
| `GET /v1/customers/lookup?phone=` | Shopkeeper | Finds a customer by normalized phone; returns only minimum customer data. |
| `GET /v1/invoices` | Session | Paginated invoices scoped to the caller’s shop or customer identity. |
| `POST /v1/invoices` | Shopkeeper | Validates/recalculates line items and creates an idempotent draft. |
| `POST /v1/invoices/:id/finalize` | Owner shopkeeper | Allocates the per-shop invoice number transactionally and freezes snapshots. |
| `POST /v1/invoices/:id/cancel` | Owner shopkeeper | Status-cancels an invoice and appends an audit event. |
| `GET /v1/warranties` | Session | Returns only warranties owned by the customer or their shop’s items. |
| `POST /v1/documents` | Customer | Starts a private signed upload with MIME/size validation. |
| `POST /v1/documents/:id/ocr` | Document owner | Runs a provider-independent OCR service; always returns reviewable fields. |
| `POST /v1/documents/:id/confirm` | Document owner | Validates edited extraction and creates the online purchase. |
| `GET /v1/notifications` | Session | Returns caller-owned in-app notifications. |

## Authorization invariant

Every query begins from the caller’s scoped `shop_id` or `customer_id`; public customer IDs, UUIDs, and invoice numbers are never authorization credentials. A shopkeeper query must include `invoice.shop_id = session.shop_id`. A customer query must include `invoice.customer_id = session.customer_id`.
