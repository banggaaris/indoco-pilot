import { pgTable, text, timestamp, decimal, integer, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const customer = pgTable("customer", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    taxId: text("tax_id"), // NPWP for Indonesian businesses
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (table) => ({
    userIdIdx: index("customer_user_id_idx").on(table.userId),
}));

export const invoice = pgTable("invoice", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull().unique(),
    customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
    tax: decimal("tax", { precision: 12, scale: 2 }).notNull().default("0.00"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0.00"),
    status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
    dueDate: timestamp("due_date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
    sentAt: timestamp("sent_at"),
    paidAt: timestamp("paid_at"),
}, (table) => ({
    userIdIdx: index("invoice_user_id_idx").on(table.userId),
    customerIdIdx: index("invoice_customer_id_idx").on(table.customerId),
    statusIdx: index("invoice_status_idx").on(table.status),
    invoiceNumberIdx: index("invoice_number_idx").on(table.invoiceNumber),
    dueDateIdx: index("invoice_due_date_idx").on(table.dueDate),
}));

export const invoiceItem = pgTable("invoice_item", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (table) => ({
    invoiceIdIdx: index("invoice_item_invoice_id_idx").on(table.invoiceId),
}));

export const transaction = pgTable("transaction", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    invoiceId: text("invoice_id").references(() => invoice.id, { onDelete: "set null" }),
    paymentMethod: text("payment_method").notNull(), // qris, transfer, cash, etc.
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    status: text("status").notNull().default("pending"), // pending, completed, failed, cancelled
    gatewayTransactionId: text("gateway_transaction_id"), // For payment gateway reference
    qrisCode: text("qris_code"), // QRIS code for payment
    paymentUrl: text("payment_url"), // Payment URL for QRIS
    fee: decimal("fee", { precision: 12, scale: 2 }).notNull().default("0.00"),
    netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
    paidAt: timestamp("paid_at"),
    expiredAt: timestamp("expired_at"),
}, (table) => ({
    userIdIdx: index("transaction_user_id_idx").on(table.userId),
    invoiceIdIdx: index("transaction_invoice_id_idx").on(table.invoiceId),
    statusIdx: index("transaction_status_idx").on(table.status),
    gatewayTransactionIdIdx: index("transaction_gateway_transaction_id_idx").on(table.gatewayTransactionId),
}));

export const paymentWebhook = pgTable("payment_webhook", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    transactionId: text("transaction_id").references(() => transaction.id, { onDelete: "cascade" }),
    gateway: text("gateway").notNull(), // midtrans, xendit, etc.
    eventType: text("event_type").notNull(), // payment.success, payment.pending, etc.
    payload: text("payload").notNull(), // JSON payload from gateway
    processed: boolean("processed").notNull().default(false),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (table) => ({
    transactionIdIdx: index("payment_webhook_transaction_id_idx").on(table.transactionId),
    gatewayIdx: index("payment_webhook_gateway_idx").on(table.gateway),
    processedIdx: index("payment_webhook_processed_idx").on(table.processed),
}));

// Types for TypeScript
export type Customer = typeof customer.$inferSelect;
export type NewCustomer = typeof customer.$inferInsert;
export type Invoice = typeof invoice.$inferSelect;
export type NewInvoice = typeof invoice.$inferInsert;
export type InvoiceItem = typeof invoiceItem.$inferSelect;
export type NewInvoiceItem = typeof invoiceItem.$inferInsert;
export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;
export type PaymentWebhook = typeof paymentWebhook.$inferSelect;
export type NewPaymentWebhook = typeof paymentWebhook.$inferInsert;