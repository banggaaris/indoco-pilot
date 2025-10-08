import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { transaction, invoice, customer } from '@/db/schema/financial';
import { eq, and, desc, sql } from 'drizzle-orm';

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
        const status = searchParams.get('status') || '';
        const paymentMethod = searchParams.get('paymentMethod') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';

        const offset = (page - 1) * limit;

        const whereConditions = [eq(transaction.userId, session.user.id)];

        if (status) {
            whereConditions.push(eq(transaction.status, status as any));
        }

        if (paymentMethod) {
            whereConditions.push(eq(transaction.paymentMethod, paymentMethod));
        }

        if (startDate) {
            whereConditions.push(
                sql`${transaction.createdAt} >= ${new Date(startDate)}`
            );
        }

        if (endDate) {
            whereConditions.push(
                sql`${transaction.createdAt} <= ${new Date(endDate)}`
            );
        }

        const transactions = await db
            .select({
                id: transaction.id,
                paymentMethod: transaction.paymentMethod,
                amount: transaction.amount,
                status: transaction.status,
                fee: transaction.fee,
                netAmount: transaction.netAmount,
                notes: transaction.notes,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
                paidAt: transaction.paidAt,
                expiredAt: transaction.expiredAt,
                invoice: {
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    status: invoice.status,
                },
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                },
            })
            .from(transaction)
            .leftJoin(invoice, eq(transaction.invoiceId, invoice.id))
            .leftJoin(customer, eq(invoice.customerId, customer.id))
            .where(and(...whereConditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(transaction.createdAt));

        const totalCountQuery = await db
            .select({ count: transaction.id })
            .from(transaction)
            .where(and(...whereConditions));

        return NextResponse.json({
            data: transactions,
            pagination: {
                page,
                limit,
                total: totalCountQuery.length,
                totalPages: Math.ceil(totalCountQuery.length / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}