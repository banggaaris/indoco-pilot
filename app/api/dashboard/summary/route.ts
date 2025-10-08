import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { invoice, transaction, customer } from '@/db/schema/financial';
import { eq, and, desc, sql, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { formatCurrency } from '@/lib/financial-utils';

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Basic counts
        const [totalCustomers] = await db
            .select({ count: customer.id })
            .from(customer)
            .where(eq(customer.userId, session.user.id));

        const [totalInvoices] = await db
            .select({ count: invoice.id })
            .from(invoice)
            .where(eq(invoice.userId, session.user.id));

        const [paidInvoices] = await db
            .select({ count: invoice.id })
            .from(invoice)
            .where(and(
                eq(invoice.userId, session.user.id),
                eq(invoice.status, 'paid')
            ));

        const [overdueInvoices] = await db
            .select({ count: invoice.id })
            .from(invoice)
            .where(and(
                eq(invoice.userId, session.user.id),
                eq(invoice.status, 'overdue')
            ));

        // Revenue calculations
        const [totalRevenue] = await db
            .select({ total: sql`SUM(CAST(${invoice.total} AS DECIMAL))` })
            .from(invoice)
            .where(and(
                eq(invoice.userId, session.user.id),
                eq(invoice.status, 'paid')
            ));

        const [recentRevenue] = await db
            .select({ total: sql`SUM(CAST(${invoice.total} AS DECIMAL))` })
            .from(invoice)
            .where(and(
                eq(invoice.userId, session.user.id),
                eq(invoice.status, 'paid'),
                gte(invoice.paidAt, startDate)
            ));

        // Outstanding invoices (sent but not paid)
        const [outstandingAmount] = await db
            .select({ total: sql`SUM(CAST(${invoice.total} AS DECIMAL))` })
            .from(invoice)
            .where(and(
                eq(invoice.userId, session.user.id),
                eq(invoice.status, 'sent'),
                isNull(invoice.paidAt)
            ));

        // Recent transactions
        const recentTransactions = await db
            .select({
                id: transaction.id,
                amount: transaction.amount,
                status: transaction.status,
                paymentMethod: transaction.paymentMethod,
                createdAt: transaction.createdAt,
                invoice: {
                    invoiceNumber: invoice.invoiceNumber,
                },
                customer: {
                    name: customer.name,
                },
            })
            .from(transaction)
            .leftJoin(invoice, eq(transaction.invoiceId, invoice.id))
            .leftJoin(customer, eq(invoice.customerId, customer.id))
            .where(and(
                eq(transaction.userId, session.user.id),
                gte(transaction.createdAt, startDate)
            ))
            .limit(10)
            .orderBy(desc(transaction.createdAt));

        // Invoice status breakdown
        const invoiceStatusBreakdown = await db
            .select({
                status: invoice.status,
                count: sql`COUNT(${invoice.id})`,
                total: sql`SUM(CAST(${invoice.total} AS DECIMAL))`,
            })
            .from(invoice)
            .where(eq(invoice.userId, session.user.id))
            .groupBy(invoice.status);

        // Monthly revenue trend
        const monthlyRevenue = await db
            .select({
                month: sql`DATE_TRUNC('month', ${invoice.paidAt})`,
                revenue: sql`SUM(CAST(${invoice.total} AS DECIMAL))`,
                count: sql`COUNT(${invoice.id})`,
            })
            .from(invoice)
            .where(and(
                eq(invoice.userId, session.user.id),
                eq(invoice.status, 'paid'),
                isNotNull(invoice.paidAt),
                gte(invoice.paidAt, new Date(now.getFullYear() - 1, 0, 1))
            ))
            .groupBy(sql`DATE_TRUNC('month', ${invoice.paidAt})`)
            .orderBy(sql`DATE_TRUNC('month', ${invoice.paidAt})`);

        return NextResponse.json({
            overview: {
                totalCustomers: totalCustomers.count,
                totalInvoices: totalInvoices.count,
                paidInvoices: paidInvoices.count,
                overdueInvoices: overdueInvoices.count,
                totalRevenue: totalRevenue.total || 0,
                recentRevenue: recentRevenue.total || 0,
                outstandingAmount: outstandingAmount.total || 0,
            },
            recentTransactions,
            invoiceStatusBreakdown,
            monthlyRevenue,
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}