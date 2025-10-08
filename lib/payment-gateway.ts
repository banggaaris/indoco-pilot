import { NewTransaction } from '@/db/schema/financial';

export interface PaymentGatewayResponse {
    success: boolean;
    transactionId?: string;
    paymentUrl?: string;
    qrisCode?: string;
    error?: string;
}

export interface PaymentStatusResponse {
    success: boolean;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    paidAt?: Date;
    error?: string;
}

export interface WebhookPayload {
    eventType: string;
    transactionId?: string;
    status: string;
    paymentMethod: string;
    amount: number;
    paidAt?: Date;
    rawPayload: any;
}

abstract class PaymentGateway {
    abstract createQrisPayment(invoiceId: string, amount: number, customerName: string, customerEmail?: string): Promise<PaymentGatewayResponse>;
    abstract checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse>;
    abstract verifyWebhookSignature(payload: string, signature: string): boolean;
    abstract parseWebhookPayload(payload: any): WebhookPayload;
}

class MidtransGateway extends PaymentGateway {
    private serverKey: string;
    private clientKey: string;
    private isProduction: boolean;

    constructor() {
        super();
        this.serverKey = process.env.MIDTRANS_SERVER_KEY || '';
        this.clientKey = process.env.MIDTRANS_CLIENT_KEY || '';
        this.isProduction = process.env.MIDTRANS_ENVIRONMENT === 'production';
    }

    async createQrisPayment(invoiceId: string, amount: number, customerName: string, customerEmail?: string): Promise<PaymentGatewayResponse> {
        try {
            const payload = {
                transaction_details: {
                    order_id: invoiceId,
                    gross_amount: amount,
                },
                item_details: [
                    {
                        id: invoiceId,
                        price: amount,
                        quantity: 1,
                        name: `Invoice ${invoiceId}`,
                    },
                ],
                customer_details: {
                    first_name: customerName,
                    email: customerEmail,
                },
                enabled_payments: ['qris'],
                expiry: {
                    unit: 'hours',
                    duration: 24,
                },
            };

            const response = await this.makeRequest('/v2/charge', payload);
            
            if (response.status_code === '201' || response.status_code === '200') {
                const qrisResponse = response.actions?.find((action: any) => action.name === 'qris');
                
                return {
                    success: true,
                    transactionId: response.transaction_id,
                    paymentUrl: qrisResponse?.url || response.redirect_url,
                    qrisCode: qrisResponse?.qr_code,
                };
            }

            return {
                success: false,
                error: response.status_message || 'Failed to create QRIS payment',
            };
        } catch (error) {
            console.error('Midtrans QRIS payment error:', error);
            return {
                success: false,
                error: 'Payment gateway error',
            };
        }
    }

    async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
        try {
            const response = await this.makeRequest(`/v2/${transactionId}/status`, {}, 'GET');
            
            const statusMap: { [key: string]: 'pending' | 'completed' | 'failed' | 'cancelled' } = {
                'pending': 'pending',
                'settlement': 'completed',
                'capture': 'completed',
                'deny': 'failed',
                'cancel': 'cancelled',
                'expire': 'failed',
                'refund': 'failed',
            };

            return {
                success: true,
                status: statusMap[response.transaction_status] || 'pending',
                paidAt: response.settlement_time ? new Date(response.settlement_time) : undefined,
            };
        } catch (error) {
            console.error('Midtrans status check error:', error);
            return {
                success: false,
                error: 'Failed to check payment status',
            };
        }
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        const crypto = require('crypto');
        const hash = crypto
            .createHash('sha512')
            .update(`${payload}${this.serverKey}`)
            .digest('hex');
        return hash === signature;
    }

    parseWebhookPayload(payload: any): WebhookPayload {
        const eventType = payload.event_type || payload.transaction_status;
        const statusMap: { [key: string]: string } = {
            'pending': 'pending',
            'settlement': 'completed',
            'capture': 'completed',
            'deny': 'failed',
            'cancel': 'cancelled',
            'expire': 'failed',
            'refund': 'failed',
        };

        return {
            eventType,
            transactionId: payload.transaction_id || payload.order_id,
            status: statusMap[payload.transaction_status] || 'pending',
            paymentMethod: payload.payment_type || 'qris',
            amount: parseInt(payload.gross_amount || '0'),
            paidAt: payload.settlement_time ? new Date(payload.settlement_time) : undefined,
            rawPayload: payload,
        };
    }

    private async makeRequest(endpoint: string, data: any = {}, method: string = 'POST') {
        const baseUrl = this.isProduction 
            ? 'https://api.midtrans.com' 
            : 'https://api.sandbox.midtrans.com';
        
        const basicAuth = Buffer.from(`${this.serverKey}:`).toString('base64');

        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${basicAuth}`,
            },
        };

        if (method === 'GET') {
            return await fetch(`${baseUrl}${endpoint}`, config).then(res => res.json());
        } else {
            config.body = JSON.stringify(data);
            return await fetch(`${baseUrl}${endpoint}`, config).then(res => res.json());
        }
    }
}

class XenditGateway extends PaymentGateway {
    private secretKey: string;

    constructor() {
        super();
        this.secretKey = process.env.XENDIT_SECRET_KEY || '';
    }

    async createQrisPayment(invoiceId: string, amount: number, customerName: string, customerEmail?: string): Promise<PaymentGatewayResponse> {
        try {
            const payload = {
                external_id: invoiceId,
                amount: amount,
                description: `Invoice ${invoiceId}`,
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment/xendit`,
                type: 'DYNAMIC',
                currency: 'IDR',
                channel_properties: {
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                },
                metadata: {
                    customer_name: customerName,
                    customer_email: customerEmail,
                },
            };

            const response = await this.makeRequest('/qr_codes', payload);
            
            return {
                success: true,
                transactionId: response.id,
                paymentUrl: response.qr_url,
                qrisCode: response.qr_id,
            };
        } catch (error) {
            console.error('Xendit QRIS payment error:', error);
            return {
                success: false,
                error: 'Payment gateway error',
            };
        }
    }

    async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
        try {
            const response = await this.makeRequest(`/qr_codes/${transactionId}`, {}, 'GET');
            
            const statusMap: { [key: string]: 'pending' | 'completed' | 'failed' | 'cancelled' } = {
                'ACTIVE': 'pending',
                'PAID': 'completed',
                'INACTIVE': 'failed',
                'EXPIRED': 'failed',
            };

            return {
                success: true,
                status: statusMap[response.status] || 'pending',
                paidAt: response.paid_at ? new Date(response.paid_at) : undefined,
            };
        } catch (error) {
            console.error('Xendit status check error:', error);
            return {
                success: false,
                error: 'Failed to check payment status',
            };
        }
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        const crypto = require('crypto');
        const token = process.env.XENDIT_WEBHOOK_TOKEN || '';
        const expectedSignature = crypto
            .createHmac('sha256', token)
            .update(payload)
            .digest('hex');
        return expectedSignature === signature;
    }

    parseWebhookPayload(payload: any): WebhookPayload {
        const statusMap: { [key: string]: string } = {
            'ACTIVE': 'pending',
            'PAID': 'completed',
            'INACTIVE': 'failed',
            'EXPIRED': 'failed',
        };

        return {
            eventType: payload.event || 'qr.payment',
            transactionId: payload.id || payload.external_id,
            status: statusMap[payload.status] || 'pending',
            paymentMethod: 'qris',
            amount: parseInt(payload.amount || '0'),
            paidAt: payload.paid_at ? new Date(payload.paid_at) : undefined,
            rawPayload: payload,
        };
    }

    private async makeRequest(endpoint: string, data: any = {}, method: string = 'POST') {
        const baseUrl = 'https://api.xendit.co';
        
        const basicAuth = Buffer.from(`${this.secretKey}:`).toString('base64');

        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${basicAuth}`,
            },
        };

        if (method === 'GET') {
            return await fetch(`${baseUrl}${endpoint}`, config).then(res => res.json());
        } else {
            config.body = JSON.stringify(data);
            return await fetch(`${baseUrl}${endpoint}`, config).then(res => res.json());
        }
    }
}

export class PaymentGatewayService {
    private gateway: PaymentGateway;
    private provider: 'midtrans' | 'xendit';

    constructor(provider: 'midtrans' | 'xendit' = 'midtrans') {
        this.provider = provider;
        this.gateway = provider === 'midtrans' ? new MidtransGateway() : new XenditGateway();
    }

    async createQrisPayment(invoiceId: string, amount: number, customerName: string, customerEmail?: string): Promise<PaymentGatewayResponse> {
        return await this.gateway.createQrisPayment(invoiceId, amount, customerName, customerEmail);
    }

    async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
        return await this.gateway.checkPaymentStatus(transactionId);
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        return this.gateway.verifyWebhookSignature(payload, signature);
    }

    parseWebhookPayload(payload: any): WebhookPayload {
        return this.gateway.parseWebhookPayload(payload);
    }

    getProvider(): string {
        return this.provider;
    }
}

export const paymentGateway = new PaymentGatewayService('midtrans');