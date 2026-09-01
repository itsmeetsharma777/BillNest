# MongoDB data model

BillNest now uses MongoDB rather than PostgreSQL. The API creates every required index automatically once `MONGODB_URI` is configured. `npm run db:indexes` remains available as a manual verification command.

| Collection | Purpose | Critical indexes |
| --- | --- | --- |
| `users` | Authentication and role | unique sparse `email`, unique sparse `phoneE164` |
| `customers` | Global customer identity | unique `customerId`, unique `normalizedPhone` |
| `shops` | Shopkeeper business profile | unique `ownerUserId` |
| `invoices` | Immutable sales records | unique `{ shopId, number }`, `{ customerId, issuedAt }` |
| `notifications` | Deduplicated in-app reminders | unique sparse `dedupeKey` |
| `auditLogs` | Security and business events | `{ actorUserId, createdAt }` |

Amounts are stored as integer paise in the server API. Authorization always scopes invoices by authenticated `shopId` or `customerId`; a public customer ID or invoice number never grants access.
