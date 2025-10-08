import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { invoice, invoiceItem, customer } from '@/db/schema/financial';
import { createInvoiceSchema, invoiceItemSchema } from '@/lib/validations/financial';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';
import { generateInvoiceNumber, calculateTax, calculateTotal, calculateLineItemTotal, addDays } from '@/lib/financial-utils';

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const customerId = searchParams.get('customerId') || '';

        const offset = (page - 1) * limit;

        const whereConditions = [eq(invoice.userId, session.user.id)];

        if (search) {
            whereConditions.push(
                sql`${invoice.invoiceNumber}::text ILIKE ${`%${search}%`} OR ${customer.name}::text ILIKE ${`%${search}%`}`
            );
        }

        if (status) {
            whereConditions.push(eq(invoice.status, status as any));
        }

        if (customerId) {
            whereConditions.push(eq(invoice.customerId, customerId));
        }

        const invoices = await db
            .select({
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                total: invoice.total,
                dueDate: invoice.dueDate,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                },
            })
            .from(invoice)
            .leftJoin(customer, eq(invoice.customerId, customer.id))
            .where(and(...whereConditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(invoice.createdAt));

        const totalCountQuery = await db
            .select({ count: invoice.id })
            .from(invoice)
            .leftJoin(customer, eq(invoice.customerId, customer.id))
            .where(and(...whereConditions));

        return NextResponse.json({
            data: invoices,
            pagination: {
                page,
                limit,
                total: totalCountQuery.length,
                totalPages: Math.ceil(totalCountQuery.length / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createInvoiceSchema.parse(body);

        // Generate unique invoice number
        let invoiceNumber = generateInvoiceNumber();
        
        // Ensure invoice number is unique
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            const [existingInvoice] = await db
                .select()
                .from(invoice)
                .where(eq(invoice.invoiceNumber, invoiceNumber));
            
            if (!existingInvoice) {
                isUnique = true;
            } else {
                invoiceNumber = generateInvoiceNumber();
                attempts++;
            }
        }

        if (!isUnique) {
            return NextResponse.json(
                { error: 'Could not generate unique invoice number' },
                { status: 500 }
            );
        }

        // Calculate totals
        const itemsSubtotal = validatedData.items.reduce((sum, item) => 
            sum + calculateLineItemTotal(item.quantity, item.unitPrice), 0
        );
        
        const taxAmount = calculateTax(itemsSubtotal, validatedData.taxRate);
        const totalAmount = calculateTotal(itemsSubtotal, taxAmount);

        // Create invoice
        const [newInvoice] = await db
            .insert(invoice)
            .values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                invoiceNumber,
                customerId: validatedData.customerId,
                subtotal: itemsSubtotal.toString(),
                tax: taxAmount.toString(),
                total: totalAmount.toString(),
                status: 'draft',
                dueDate: new Date(validatedData.dueDate),
                notes: validatedData.notes || null,
                updatedAt: new Date(),
            })
            .returning();

        // Create invoice items
        const invoiceItemsToInsert = validatedData.items.map((item) => ({
            id: crypto.randomUUID(),
            invoiceId: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            total: calculateLineItemTotal(item.quantity, item.unitPrice).toString(),
            createdAt: new Date(),
        }));

        await db.insert(invoiceItem).values(invoiceItemsToInsert);

        // Return the complete invoice with items
        const [completeInvoice] = await db
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
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                },
            })
            .from(invoice)
            .leftJoin(customer, eq(invoice.customerId, customer.id))
            .where(and(
                eq(invoice.id, newInvoice.id),
                eq(invoice.userId, session.user.id)
            ));

        return NextResponse.json(completeInvoice, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating invoice:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}