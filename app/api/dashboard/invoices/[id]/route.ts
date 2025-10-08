import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { invoice, invoiceItem, customer } from '@/db/schema/financial';
import { updateInvoiceSchema, invoiceItemSchema } from '@/lib/validations/financial';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { calculateTax, calculateTotal, calculateLineItemTotal } from '@/lib/financial-utils';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [invoiceData] = await db
            .select({
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                total: invoice.total,
                dueDate: invoice.dueDate,
                notes: invoice.notes,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
                sentAt: invoice.sentAt,
                paidAt: invoice.paidAt,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address,
                    taxId: customer.taxId,
                },
            })
            .from(invoice)
            .leftJoin(customer, eq(invoice.customerId, customer.id))
            .where(and(
                eq(invoice.id, params.id),
                eq(invoice.userId, session.user.id)
            ));

        if (!invoiceData) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Get invoice items
        const items = await db
            .select()
            .from(invoiceItem)
            .where(eq(invoiceItem.invoiceId, params.id))
            .orderBy(invoiceItem.createdAt);

        return NextResponse.json({
            ...invoiceData,
            items,
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = updateInvoiceSchema.parse(body);

        // Check if invoice exists and belongs to user
        const [existingInvoice] = await db
            .select()
            .from(invoice)
            .where(and(
                eq(invoice.id, params.id),
                eq(invoice.userId, session.user.id)
            ));

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Don't allow updates to paid invoices
        if (existingInvoice.status === 'paid') {
            return NextResponse.json(
                { error: 'Cannot update paid invoice' },
                { status: 400 }
            );
        }

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (validatedData.customerId !== undefined) {
            updateData.customerId = validatedData.customerId;
        }

        if (validatedData.dueDate !== undefined) {
            updateData.dueDate = new Date(validatedData.dueDate);
        }

        if (validatedData.notes !== undefined) {
            updateData.notes = validatedData.notes || null;
        }

        if (validatedData.status !== undefined) {
            updateData.status = validatedData.status;
            
            // Update timestamps based on status
            if (validatedData.status === 'sent' && !existingInvoice.sentAt) {
                updateData.sentAt = new Date();
            } else if (validatedData.status === 'paid' && !existingInvoice.paidAt) {
                updateData.paidAt = new Date();
            }
        }

        if (validatedData.items && validatedData.items.length > 0) {
            // Recalculate totals based on items
            const itemsSubtotal = validatedData.items.reduce((sum, item) => 
                sum + calculateLineItemTotal(item.quantity, item.unitPrice), 0
            );
            
            const taxAmount = calculateTax(itemsSubtotal, validatedData.taxRate || 0.11);
            const totalAmount = calculateTotal(itemsSubtotal, taxAmount);

            updateData.subtotal = itemsSubtotal.toString();
            updateData.tax = taxAmount.toString();
            updateData.total = totalAmount.toString();

            // Update invoice items
            await db.delete(invoiceItem).where(eq(invoiceItem.invoiceId, params.id));

            const newItems = validatedData.items.map((item) => ({
                id: crypto.randomUUID(),
                invoiceId: params.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice.toString(),
                total: calculateLineItemTotal(item.quantity, item.unitPrice).toString(),
                createdAt: new Date(),
            }));

            await db.insert(invoiceItem).values(newItems);
        }

        const [updatedInvoice] = await db
            .update(invoice)
            .set(updateData)
            .where(and(
                eq(invoice.id, params.id),
                eq(invoice.userId, session.user.id)
            ))
            .returning();

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error updating invoice:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [existingInvoice] = await db
            .select()
            .from(invoice)
            .where(and(
                eq(invoice.id, params.id),
                eq(invoice.userId, session.user.id)
            ));

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Don't allow deletion of paid invoices
        if (existingInvoice.status === 'paid') {
            return NextResponse.json(
                { error: 'Cannot delete paid invoice' },
                { status: 400 }
            );
        }

        // Delete invoice items first (due to foreign key constraint)
        await db.delete(invoiceItem).where(eq(invoiceItem.invoiceId, params.id));

        // Delete invoice
        await db
            .delete(invoice)
            .where(and(
                eq(invoice.id, params.id),
                eq(invoice.userId, session.user.id)
            ));

        return NextResponse.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}