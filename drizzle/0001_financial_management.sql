-- Create customer table
CREATE TABLE IF NOT EXISTS "customer" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "name" text NOT NULL,
    "email" text,
    "phone" text,
    "address" text,
    "tax_id" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create invoice table
CREATE TABLE IF NOT EXISTS "invoice" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "invoice_number" text NOT NULL,
    "customer_id" text,
    "subtotal" decimal(12,2) DEFAULT 0.00 NOT NULL,
    "tax" decimal(12,2) DEFAULT 0.00 NOT NULL,
    "total" decimal(12,2) DEFAULT 0.00 NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "due_date" timestamp NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "sent_at" timestamp,
    "paid_at" timestamp,
    CONSTRAINT "invoice_invoice_number_unique" UNIQUE("invoice_number")
);

-- Create invoice_item table
CREATE TABLE IF NOT EXISTS "invoice_item" (
    "id" text PRIMARY KEY NOT NULL,
    "invoice_id" text NOT NULL,
    "description" text NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" decimal(12,2) NOT NULL,
    "total" decimal(12,2) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create transaction table
CREATE TABLE IF NOT EXISTS "transaction" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "invoice_id" text,
    "payment_method" text NOT NULL,
    "amount" decimal(12,2) NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "gateway_transaction_id" text,
    "qris_code" text,
    "payment_url" text,
    "fee" decimal(12,2) DEFAULT 0.00 NOT NULL,
    "net_amount" decimal(12,2) NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "paid_at" timestamp,
    "expired_at" timestamp
);

-- Create payment_webhook table
CREATE TABLE IF NOT EXISTS "payment_webhook" (
    "id" text PRIMARY KEY NOT NULL,
    "transaction_id" text,
    "gateway" text NOT NULL,
    "event_type" text NOT NULL,
    "payload" text NOT NULL,
    "processed" boolean DEFAULT false NOT NULL,
    "processed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "customer_user_id_idx" ON "customer" ("user_id");
CREATE INDEX IF NOT EXISTS "invoice_user_id_idx" ON "invoice" ("user_id");
CREATE INDEX IF NOT EXISTS "invoice_customer_id_idx" ON "invoice" ("customer_id");
CREATE INDEX IF NOT EXISTS "invoice_status_idx" ON "invoice" ("status");
CREATE INDEX IF NOT EXISTS "invoice_number_idx" ON "invoice" ("invoice_number");
CREATE INDEX IF NOT EXISTS "invoice_due_date_idx" ON "invoice" ("due_date");
CREATE INDEX IF NOT EXISTS "invoice_item_invoice_id_idx" ON "invoice_item" ("invoice_id");
CREATE INDEX IF NOT EXISTS "transaction_user_id_idx" ON "transaction" ("user_id");
CREATE INDEX IF NOT EXISTS "transaction_invoice_id_idx" ON "transaction" ("invoice_id");
CREATE INDEX IF NOT EXISTS "transaction_status_idx" ON "transaction" ("status");
CREATE INDEX IF NOT EXISTS "transaction_gateway_transaction_id_idx" ON "transaction" ("gateway_transaction_id");
CREATE INDEX IF NOT EXISTS "payment_webhook_transaction_id_idx" ON "payment_webhook" ("transaction_id");
CREATE INDEX IF NOT EXISTS "payment_webhook_gateway_idx" ON "payment_webhook" ("gateway");
CREATE INDEX IF NOT EXISTS "payment_webhook_processed_idx" ON "payment_webhook" ("processed");

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "customer" ADD CONSTRAINT "customer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoice" ADD CONSTRAINT "invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "transaction" ADD CONSTRAINT "transaction_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "payment_webhook" ADD CONSTRAINT "payment_webhook_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;