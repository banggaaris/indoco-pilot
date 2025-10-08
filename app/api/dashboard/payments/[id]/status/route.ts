import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { transaction, invoice } from '@/db/schema/financial';
import { eq, and } from 'drizzle-orm';
import { paymentGateway } from '@/lib/payment-gateway';

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

        // Find the transaction
        const [transactionData] = await db
            .select({
                id: transaction.id,
                status: transaction.status,
                amount: transaction.amount,
                gatewayTransactionId: transaction.gatewayTransactionId,
                invoiceId: transaction.invoiceId,
                paymentMethod: transaction.paymentMethod,
                createdAt: transaction.createdAt,
                paidAt: transaction.paidAt,
                expiredAt: transaction.expiredAt,
                invoice: {
                    id: invoice.id,
                    status: invoice.status,
                    invoiceNumber: invoice.invoiceNumber,
                },
            })
            .from(transaction)
            .leftJoin(invoice, eq(transaction.invoiceId, invoice.id))
            .where(and(
                eq(transaction.id, params.id),
                eq(transaction.userId, session.user.id)
            ));

        if (!transactionData) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Check payment status from gateway if transaction is pending
        let gatewayStatus = null;
        if (transactionData.status === 'pending' && transactionData.gatewayTransactionId) {
            const statusResponse = await paymentGateway.checkPaymentStatus(
                transactionData.gatewayTransactionId
            );
            
            if (statusResponse.success) {
                gatewayStatus = {
                    status: statusResponse.status,
                    paidAt: statusResponse.paidAt,
                };

                // Update transaction status if it changed
                if (statusResponse.status !== transactionData.status) {
                    const updateData: any = {
                        status: statusResponse.status,
                        updatedAt: new Date(),
                    };

                    if (statusResponse.paidAt) {
                        updateData.paidAt = statusResponse.paidAt;
                    }

                    // Update transaction
                    await db
                        .update(transaction)
                        .set(updateData)
                        .where(eq(transaction.id, params.id));

                    // Update invoice status if payment is completed
                    if (statusResponse.status === 'completed' && transactionData.invoiceId) {
                        await db
                            .update(invoice)
                            .set({
                                status: 'paid',
                                paidAt: statusResponse.paidAt || new Date(),
                                updatedAt: new Date(),
                            })
                            .where(eq(invoice.id, transactionData.invoiceId));
                    }

                    // Update transaction data with new status
                    transactionData.status = statusResponse.status;
                    transactionData.paidAt = statusResponse.paidAt;
                }
            }
        }

        // Calculate if payment is expired
        const isExpired = transactionData.expiredAt && 
                         new Date() > transactionData.expiredAt && 
                         transactionData.status === 'pending';

        return NextResponse.json({
            transaction: {
                id: transactionData.id,
                status: isExpired ? 'expired' : transactionData.status,
                amount: transactionData.amount,
                paymentMethod: transactionData.paymentMethod,
                createdAt: transactionData.createdAt,
                paidAt: transactionData.paidAt,
                expiredAt: transactionData.expiredAt,
                isExpired,
                invoice: transactionData.invoice,
            },
            gatewayStatus,
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}