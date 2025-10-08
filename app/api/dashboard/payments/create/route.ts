import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { invoice, customer, transaction } from '@/db/schema/financial';
import { paymentSchema } from '@/lib/validations/financial';
import { eq, and } from 'drizzle-orm';
import { paymentGateway } from '@/lib/payment-gateway';
import { z } from 'zod';

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = paymentSchema.parse(body);

        // Check if invoice exists and belongs to user
        const [invoiceData] = await db
            .select({
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                total: invoice.total,
                status: invoice.status,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                },
            })
            .from(invoice)
            .leftJoin(customer, eq(invoice.customerId, customer.id))
            .where(and(
                eq(invoice.id, validatedData.invoiceId),
                eq(invoice.userId, session.user.id)
            ));

        if (!invoiceData) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Check if invoice is already paid
        if (invoiceData.status === 'paid') {
            return NextResponse.json(
                { error: 'Invoice is already paid' },
                { status: 400 }
            );
        }

        // Check if invoice is in draft status
        if (invoiceData.status === 'draft') {
            return NextResponse.json(
                { error: 'Please send the invoice first before creating payment' },
                { status: 400 }
            );
        }

        // Check if there's already a pending payment for this invoice
        const [existingTransaction] = await db
            .select()
            .from(transaction)
            .where(and(
                eq(transaction.invoiceId, validatedData.invoiceId),
                eq(transaction.status, 'pending')
            ));

        if (existingTransaction) {
            return NextResponse.json({
                message: 'Payment already created',
                transaction: {
                    id: existingTransaction.id,
                    paymentUrl: existingTransaction.paymentUrl,
                    qrisCode: existingTransaction.qrisCode,
                    amount: existingTransaction.amount,
                    status: existingTransaction.status,
                    expiresAt: existingTransaction.expiredAt,
                },
            });
        }

        // Create QRIS payment
        const amount = parseFloat(invoiceData.total.toString());
        const paymentResponse = await paymentGateway.createQrisPayment(
            invoiceData.id,
            amount,
            invoiceData.customer?.name || 'Customer',
            invoiceData.customer?.email
        );

        if (!paymentResponse.success) {
            return NextResponse.json(
                { error: paymentResponse.error || 'Failed to create payment' },
                { status: 500 }
            );
        }

        // Calculate payment fee (typical QRIS fee is around 0.7%)
        const fee = Math.round(amount * 0.007 * 100) / 100;
        const netAmount = amount - fee;

        // Create transaction record
        const [newTransaction] = await db
            .insert(transaction)
            .values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                invoiceId: invoiceData.id,
                paymentMethod: validatedData.paymentMethod,
                amount: amount.toString(),
                status: 'pending',
                gatewayTransactionId: paymentResponse.transactionId,
                qrisCode: paymentResponse.qrisCode,
                paymentUrl: paymentResponse.paymentUrl,
                fee: fee.toString(),
                netAmount: netAmount.toString(),
                notes: validatedData.notes || null,
                updatedAt: new Date(),
                expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            })
            .returning();

        // Update invoice status to sent if it's not already
        if (invoiceData.status === 'draft') {
            await db
                .update(invoice)
                .set({
                    status: 'sent',
                    sentAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(invoice.id, invoiceData.id));
        }

        return NextResponse.json({
            success: true,
            transaction: {
                id: newTransaction.id,
                paymentUrl: newTransaction.paymentUrl,
                qrisCode: newTransaction.qrisCode,
                amount: newTransaction.amount,
                fee: newTransaction.fee,
                netAmount: newTransaction.netAmount,
                status: newTransaction.status,
                expiresAt: newTransaction.expiredAt,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating payment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}