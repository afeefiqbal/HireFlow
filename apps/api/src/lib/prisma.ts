import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations for Node development hot-reloading
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Ensure a single persistent PrismaClient instance to avoid connection pool exhaustion
// and eliminate multi-second SSL handshake penalties on every request.
export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Pre-warms the database connection on server bootstrap.
 */
export async function initPrisma(): Promise<void> {
  try {
    const start = Date.now();
    await prisma.$connect();
    console.log(`🔌 [Prisma] Database connection established in ${Date.now() - start}ms`);
  } catch (error: any) {
    console.error('❌ [Prisma] Failed to connect to database on startup:', error.message);
  }
}
