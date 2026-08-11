-- BillNest PostgreSQL 16 schema. Run through a migration tool in production.
-- All public identifiers differ from internal UUID primary keys.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('CUSTOMER', 'SHOPKEEPER', 'ADMIN');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'FINALIZED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED', 'REFUNDED');
CREATE TYPE warranty_status AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'NO_WARRANTY');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  password_hash text NOT NULL,
  email citext UNIQUE,
  phone_e164 varchar(16) UNIQUE,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone_e164 IS NOT NULL)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  customer_id varchar(12) NOT NULL UNIQUE CHECK (customer_id ~ '^CUS-[A-F0-9]{8}$'),
  normalized_phone varchar(16) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  email citext,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES users(id),
  name varchar(160) NOT NULL,
  invoice_prefix varchar(12) NOT NULL DEFAULT 'INV',
  phone_e164 varchar(16) NOT NULL,
  email citext NOT NULL,
  address text NOT NULL,
  state_code char(2) NOT NULL,
  gstin varchar(15),
  invoice_sequence integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, invoice_prefix)
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  invoice_number varchar(48) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'DRAFT',
  payment_method varchar(32),
  issued_at timestamptz,
  -- immutable snapshots retain historical legal document data after profile changes
  shop_snapshot jsonb NOT NULL,
  customer_snapshot jsonb NOT NULL,
  subtotal_paise bigint NOT NULL CHECK (subtotal_paise >= 0),
  discount_paise bigint NOT NULL CHECK (discount_paise >= 0),
  cgst_paise bigint NOT NULL DEFAULT 0 CHECK (cgst_paise >= 0),
  sgst_paise bigint NOT NULL DEFAULT 0 CHECK (sgst_paise >= 0),
  igst_paise bigint NOT NULL DEFAULT 0 CHECK (igst_paise >= 0),
  other_charges_paise bigint NOT NULL DEFAULT 0,
  round_off_paise bigint NOT NULL DEFAULT 0,
  total_paise bigint NOT NULL CHECK (total_paise >= 0),
  idempotency_key uuid UNIQUE,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, invoice_number),
  CHECK ((status <> 'CANCELLED') OR cancelled_at IS NOT NULL)
);

CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_name varchar(255) NOT NULL,
  brand varchar(120), model_number varchar(120), serial_number varchar(255), sku varchar(120),
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  unit_price_paise bigint NOT NULL CHECK (unit_price_paise >= 0),
  discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  gst_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (gst_percent BETWEEN 0 AND 100),
  notes text
);

CREATE TABLE warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_item_id uuid NOT NULL UNIQUE REFERENCES invoice_items(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  provider varchar(160), terms text,
  duration_months integer NOT NULL DEFAULT 0 CHECK (duration_months >= 0),
  starts_on date, ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((duration_months = 0 AND starts_on IS NULL AND ends_on IS NULL) OR (starts_on IS NOT NULL AND ends_on IS NOT NULL AND ends_on >= starts_on))
);

CREATE TABLE uploaded_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  storage_key text NOT NULL UNIQUE,
  original_filename varchar(255) NOT NULL,
  content_type varchar(100) NOT NULL CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  ocr_status varchar(24) NOT NULL DEFAULT 'PENDING',
  extracted_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES customers(id),
  type varchar(40) NOT NULL, title varchar(180) NOT NULL, body text NOT NULL,
  dedupe_key varchar(120) UNIQUE, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY, actor_user_id uuid REFERENCES users(id), action varchar(80) NOT NULL,
  entity_type varchar(80) NOT NULL, entity_id uuid, request_id uuid, ip_hash varchar(128), metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invoices_customer_created_idx ON invoices(customer_id, created_at DESC);
CREATE INDEX invoices_shop_created_idx ON invoices(shop_id, created_at DESC);
CREATE INDEX invoices_search_idx ON invoices(shop_id, invoice_number);
CREATE INDEX invoice_items_serial_idx ON invoice_items(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX warranties_customer_end_idx ON warranties(customer_id, ends_on) WHERE duration_months > 0;
CREATE INDEX notifications_customer_read_idx ON notifications(customer_id, read_at, created_at DESC);
