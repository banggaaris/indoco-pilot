import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as financialSchema from './schema/financial';

export const db = drizzle(process.env.DATABASE_URL!, {
    schema: { ...authSchema, ...financialSchema },
});

export * from './schema/auth';
export * from './schema/financial';