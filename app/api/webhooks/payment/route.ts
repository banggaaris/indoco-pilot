import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transaction, invoice, paymentWebhook } from '@/db/schema/financial';
import { eq, and } from 'drizzle-orm';
import { paymentGateway, PaymentGatewayService } from '@/lib/payment-gateway';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const payload = JSON.parse(body);
        
        // Get the payment provider from the URL or payload
        const provider = new URL(request.url).searchParams.get('provider') || 
                        payload.payment_provider || 
                        'midtrans';
        
        const gateway = new PaymentGatewayService(provider as 'midtrans' | 'xendit');
        
        // Verify webhook signature
        const signature = request.headers.get('x-callback-token') || 
                         request.headers.get('x-signature') || 
                         '';
        
        if (!signature || !gateway.verifyWebhookSignature(body, signature)) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Parse webhook payload
        const webhookData = gateway.parseWebhookPayload(payload);
        
        // Store webhook payload for idempotency and debugging
        const [webhookRecord] = await db
            .insert(paymentWebhook)
            .values({
                id: crypto.randomUUID(),
                transactionId: webhookData.transactionId || null,
                gateway: provider,
                eventType: webhookData.eventType,
                payload: body,
                processed: false,
                createdAt: new Date(),
            })
            .returning();

        // Process the webhook
        await processWebhook(gateway, webhookData, webhookRecord.id);

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function processWebhook(
    gateway: PaymentGatewayService,
    webhookData: any,
    webhookRecordId: string
) {
    try {
        // Check if this is a payment status update
        if (!webhookData.transactionId) {
            await markWebhookProcessed(webhookRecordId);
            return;
        }

        // Find the transaction
        const [transactionRecord] = await db
            .select()
            .from(transaction)
            .where(eq(transaction.gatewayTransactionId, webhookData.transactionId));

        if (!transactionRecord) {
            console.warn(`Transaction not found for gateway transaction ID: ${webhookData.transactionId}`);
            await markWebhookProcessed(webhookRecordId);
            return;
        }

        // Only process if status has changed
        if (transactionRecord.status === webhookData.status) {
            await markWebhookProcessed(webhookRecordId);
            return;
        }

        // Update transaction status
        const updateData: any = {
            status: webhookData.status,
            updatedAt: new Date(),
        };

        if (webhookData.paidAt) {
            updateData.paidAt = webhookData.paidAt;
        }

        if (webhookData.status === 'completed') {
            // Update invoice status to paid
            if (transactionRecord.invoiceId) {
                await db
                    .update(invoice)
                    .set({
                        status: 'paid',
                        paidAt: webhookData.paidAt || new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(invoice.id, transactionRecord.invoiceId));
            }
        } else if (webhookData.status === 'failed' || webhookData.status === 'cancelled') {
            // Update invoice status back to sent if payment failed
            if (transactionRecord.invoiceId) {
                await db
                    .update(invoice)
                    .set({
                        status: 'sent',
                        updatedAt: new Date(),
                    })
                    .where(and(
                        eq(invoice.id, transactionRecord.invoiceId),
                        eq(invoice.status, 'paid') // Only update if currently marked as paid
                    ));
            }
        }

        await db
            .update(transaction)
            .set(updateData)
            .where(eq(transaction.id, transactionRecord.id));

        // Mark webhook as processed
        await markWebhookProcessed(webhookRecordId);

        console.log(`Successfully processed webhook for transaction ${transactionRecord.id}`);
    } catch (error) {
        console.error('Error processing webhook:', error);
        throw error;
    }
}

async function markWebhookProcessed(webhookRecordId: string) {
    await db
        .update(paymentWebhook)
        .set({
            processed: true,
            processedAt: new Date(),
        })
        .where(eq(paymentWebhook.id, webhookRecordId));
}

// GET endpoint for testing webhook availability
export async function GET() {
    return NextResponse.json({ 
        status: 'webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
}