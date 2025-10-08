import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { customer, NewCustomer } from '@/db/schema/financial';
import { customerSchema } from '@/lib/validations/financial';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

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

        const offset = (page - 1) * limit;

        const whereConditions = [eq(customer.userId, session.user.id)];

        if (search) {
            whereConditions.push(
                `(${customer.name.ilike(`%${search}%`)} OR ${customer.email.ilike(`%${search}%`)} OR ${customer.phone.ilike(`%${search}%`)})`
            );
        }

        const customers = await db
            .select()
            .from(customer)
            .where(and(...whereConditions))
            .limit(limit)
            .offset(offset)
            .orderBy(customer.createdAt);

        const totalCount = await db
            .select({ count: customer.id })
            .from(customer)
            .where(and(...whereConditions));

        return NextResponse.json({
            data: customers,
            pagination: {
                page,
                limit,
                total: totalCount.length,
                totalPages: Math.ceil(totalCount.length / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
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
        const validatedData = customerSchema.parse(body);

        const newCustomer: NewCustomer = {
            ...validatedData,
            userId: session.user.id,
        };

        const [createdCustomer] = await db
            .insert(customer)
            .values(newCustomer)
            .returning();

        return NextResponse.json(createdCustomer, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating customer:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}