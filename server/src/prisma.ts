import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chufangapp?schema=public';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url })
});

