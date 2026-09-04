# Connect BillNest to MongoDB Atlas

BillNest has no bundled production data and does not include Atlas credentials. Keep every secret in a local `.env` file; `.env` is ignored by Git.

1. Create a free or paid cluster at [MongoDB Atlas](https://www.mongodb.com/atlas/database), then create a database user with a long generated password. Give that user the `readWrite` role only for the `billnest` database.
2. In **Network Access**, add your current development IP address. Do not leave `0.0.0.0/0` open in a deployed environment.
3. In **Connect → Drivers**, copy the SRV connection string. Replace **both** `<username>` and `<db_password>` with the actual Atlas database-user values. Do not leave angle brackets in the URI. If the password includes `@`, `:`, `/`, `?`, `#`, `[`, or `]`, URL-encode it first; a password with `@` becomes `%40`.
4. Copy the template and set strong secrets:

```bash
cp .env.example .env
```

```env
MONGODB_URI=mongodb+srv://billnest_app:URL_ENCODED_PASSWORD@your-cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=billnest
JWT_SECRET=paste-a-random-64-character-secret-here
AUDIT_LOG_SALT=paste-a-different-random-secret-here
CLIENT_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173
```

Generate each secret with `openssl rand -hex 32` and never put it in client-side `VITE_` variables.

5. Start both services. The API creates the required indexes automatically on its first database connection:

```bash
npm run dev
```

6. Visit `http://localhost:4000/api/health`. A successful response reports `database: "connected"`. Then register through `http://localhost:5173`; the success message will say the workspace is connected to MongoDB.

## Use the same database in MongoDB Compass

1. Open Compass and select **New Connection**.
2. Paste the exact `MONGODB_URI` from `.env` (not the database name by itself), then click **Connect**.
3. Select the `billnest` database. You will see `users`, `customers`, `shops`, `invoices`, `passwordResets`, `notifications`, and `auditLogs` after the first use.

Compass is only a database viewer/editor; the deployed app and local API use the same Atlas URI. Do not edit password hashes, reset tokens, counters, or invoice totals manually.

## Vercel production values

In **Vercel → Project → Settings → Environment Variables**, add these values for **Production** (and add the same database/secrets to **Preview** if you need preview deployments to work):

| Name              | Value                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `MONGODB_URI`     | Your full Atlas SRV string                                                |
| `MONGODB_DB_NAME` | `billnest`                                                                |
| `JWT_SECRET`      | A fresh `openssl rand -hex 32` value                                      |
| `AUDIT_LOG_SALT`  | A different `openssl rand -hex 32` value                                  |
| `CLIENT_ORIGIN`   | Your exact Vercel URL, for example `https://billnest.vercel.app`          |
| `APP_URL`         | The same exact Vercel URL; used only for password-reset links             |
| `EMAIL_PROVIDER`  | `resend` after email delivery is configured                               |
| `EMAIL_API_KEY`   | Resend API key, stored only in Vercel                                     |
| `EMAIL_FROM`      | A Resend-verified sender, for example `BillNest <support@yourdomain.com>` |

Deploy again after saving the variables. Keep `VITE_API_URL` empty when the Vite frontend and the Vercel API function are in this one project; the browser then calls its own `/api` route securely.

Atlas needs network access from both Compass and Vercel. Add your current IP for Compass. Vercel serverless functions do not use a stable public egress IP on the standard platform, so the practical Atlas configuration is `0.0.0.0/0` **only together with** a unique long database password, `readWrite` access restricted to `billnest`, and rotated credentials. A static-IP backend is required if your security policy forbids that Atlas rule.

For a hosted deployment, set `NODE_ENV=production`, use HTTPS, and rotate database/JWT secrets if they are ever exposed.

## What is stored

MongoDB holds accounts, one global customer record per normalized phone, shop profiles, invoices, notifications, and audit events. Passwords are bcrypt hashes; money is recomputed server-side and stored in integer paise. See [`../db/mongodb.md`](../db/mongodb.md) for the collection/index overview.
