# Connect BillNest to MongoDB Atlas

BillNest has no bundled production data and does not include Atlas credentials. Keep every secret in a local `.env` file; `.env` is ignored by Git.

1. Create a free or paid cluster at [MongoDB Atlas](https://www.mongodb.com/atlas/database), then create a database user with a long generated password. Give that user the `readWrite` role only for the `billnest` database.
2. In **Network Access**, add your current development IP address. Do not leave `0.0.0.0/0` open in a deployed environment.
3. In **Connect → Drivers**, copy the SRV connection string. Replace `<username>` and `<password>` with URL-encoded values.
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
```

Generate each secret with `openssl rand -hex 32` and never put it in client-side `VITE_` variables.

5. Start both services. The API creates the required indexes automatically on its first database connection:

```bash
npm run dev
```

6. Visit `http://localhost:4000/api/health`. A successful response reports `database: "connected"`. Then register through `http://localhost:5173`; the success message will say the workspace is connected to MongoDB.

For a hosted deployment, set `NODE_ENV=production`, use HTTPS, set `CLIENT_ORIGIN` to the exact public frontend origin, allow only the application server’s egress IP in Atlas, and rotate database/JWT secrets if they are ever exposed.

## What is stored

MongoDB holds accounts, one global customer record per normalized phone, shop profiles, invoices, notifications, and audit events. Passwords are bcrypt hashes; money is recomputed server-side and stored in integer paise. See [`../db/mongodb.md`](../db/mongodb.md) for the collection/index overview.
