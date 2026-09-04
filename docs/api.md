# BillNest API

All endpoints use the `/api` prefix and return `{ "data": ... }` or `{ "error": { "code", "message" } }`.

| Endpoint                                | Access                      | Purpose                                                                 |
| --------------------------------------- | --------------------------- | ----------------------------------------------------------------------- |
| `GET /api/health`                       | Public                      | Verifies that MongoDB is reachable.                                     |
| `POST /api/auth/register/shopkeeper`    | Public, rate-limited        | Creates a shopkeeper and shop.                                          |
| `POST /api/auth/register/customer`      | Public, rate-limited        | Creates a customer account and global customer record.                  |
| `POST /api/auth/login`                  | Public, rate-limited        | Creates an authenticated session.                                       |
| `POST /api/auth/password-reset/request` | Public, rate-limited        | Sends a one-hour password-reset link when email delivery is configured. |
| `POST /api/auth/password-reset/confirm` | Public                      | Consumes a single-use reset token and changes the password.             |
| `POST /api/auth/logout`                 | Session + CSRF              | Ends the session.                                                       |
| `GET` / `PATCH /api/shops/me`           | Shopkeeper; PATCH also CSRF | Reads or updates the active shop profile.                               |
| `GET /api/customers/lookup?phone=`      | Shopkeeper                  | Returns the minimum customer details for an E.164 phone.                |
| `GET /api/invoices`                     | Session                     | Returns only the caller’s invoices.                                     |
| `POST /api/invoices`                    | Shopkeeper + CSRF           | Recalculates and stores a draft or paid invoice.                        |

Protected mutations require both the `billnest_session` HttpOnly cookie and matching `billnest_csrf` cookie / `X-CSRF-Token` header. The frontend obtains the CSRF cookie during registration or login.

Authorization is always applied by the server query’s `shopId` or `customerId`. Client-supplied IDs, invoice numbers, and customer IDs are not authorization proof.
