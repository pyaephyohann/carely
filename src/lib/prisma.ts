import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
  const databaseUrl = process.env.DATABASE_URL;
  if (
    !databaseUrl ||
    databaseUrl.includes("YOUR_DB_USER") ||
    databaseUrl.includes("YOUR_DB_PASSWORD")
  ) {
    // No valid database URL — return null so API routes can handle gracefully
    return null;
  }

  try {
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (error) {
    console.warn("Failed to create Prisma client:", error);
    return null;
  }
}

/**
 * Prisma client singleton.
 * Returns null if no database is configured (e.g., during build without DATABASE_URL).
 * API routes should check for null and return an appropriate error.
 */
export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
