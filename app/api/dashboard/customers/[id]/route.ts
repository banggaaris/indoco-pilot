import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { customer, NewCustomer } from '@/db/schema/financial';
import { customerSchema } from '@/lib/validations/financial';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

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

        const [customerData] = await db
            .select()
            .from(customer)
            .where(and(
                eq(customer.id, params.id),
                eq(customer.userId, session.user.id)
            ));

        if (!customerData) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json(customerData);
    } catch (error) {
        console.error('Error fetching customer:', error);
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
        const validatedData = customerSchema.parse(body);

        const [existingCustomer] = await db
            .select()
            .from(customer)
            .where(and(
                eq(customer.id, params.id),
                eq(customer.userId, session.user.id)
            ));

        if (!existingCustomer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const [updatedCustomer] = await db
            .update(customer)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(and(
                eq(customer.id, params.id),
                eq(customer.userId, session.user.id)
            ))
            .returning();

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error updating customer:', error);
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

        const [existingCustomer] = await db
            .select()
            .from(customer)
            .where(and(
                eq(customer.id, params.id),
                eq(customer.userId, session.user.id)
            ));

        if (!existingCustomer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        await db
            .delete(customer)
            .where(and(
                eq(customer.id, params.id),
                eq(customer.userId, session.user.id)
            ));

        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}