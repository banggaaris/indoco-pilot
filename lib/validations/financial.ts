import { z } from "zod";

export const customerSchema = z.object({
    name: z.string().min(1, "Customer name is required").max(255),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
    address: z.string().max(500).optional().or(z.literal("")),
    taxId: z.string().max(50).optional().or(z.literal("")),
});

export const invoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required").max(1000),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
});

export const invoiceSchema = z.object({
    customerId: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
    dueDate: z.string().min(1, "Due date is required"),
    notes: z.string().max(2000).optional().or(z.literal("")),
    taxRate: z.number().min(0).max(1).default(0.11),
});

export const createInvoiceSchema = invoiceSchema.extend({
    customerId: z.string().min(1, "Customer is required"),
});

export const updateInvoiceSchema = invoiceSchema.partial().extend({
    status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
});

export const paymentSchema = z.object({
    invoiceId: z.string().min(1, "Invoice ID is required"),
    paymentMethod: z.enum(["qris", "transfer", "cash", "other"]),
    amount: z.number().min(1000, "Amount must be at least 1000"),
    notes: z.string().max(500).optional().or(z.literal("")),
});

export const transactionSchema = z.object({
    id: z.string().optional(),
    invoiceId: z.string().optional(),
    paymentMethod: z.string().min(1, "Payment method is required"),
    amount: z.number().min(0, "Amount must be positive"),
    status: z.enum(["pending", "completed", "failed", "cancelled"]).default("pending"),
    gatewayTransactionId: z.string().optional(),
    qrisCode: z.string().optional(),
    paymentUrl: z.string().optional(),
    fee: z.number().min(0).default(0),
    netAmount: z.number().min(0),
    notes: z.string().max(500).optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;