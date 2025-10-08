import { type ClassValue, clsx } from "clsx";

export function generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `INV/${year}${month}/${random}`;
}

export function formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numAmount);
}

export function calculateTax(subtotal: number, taxRate: number = 0.11): number {
    return Math.round(subtotal * taxRate * 100) / 100;
}

export function calculateTotal(subtotal: number, tax: number): number {
    return Math.round((subtotal + tax) * 100) / 100;
}

export function calculateLineItemTotal(quantity: number, unitPrice: number): number {
    return Math.round(quantity * unitPrice * 100) / 100;
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function isOverdue(dueDate: Date): boolean {
    return new Date() > dueDate;
}

export function getInvoiceStatus(dueDate: Date, isPaid: boolean): 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' {
    if (isPaid) return 'paid';
    if (isOverdue(dueDate)) return 'overdue';
    return 'sent';
}