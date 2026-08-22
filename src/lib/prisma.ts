// Prisma client singleton
// This will be fully functional after running `prisma generate`
// For now, it's a placeholder until the database schema is created.

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */

let _prisma: any = null;

export function getPrisma(): any {
  if (!_prisma) {
    const { PrismaClient } = require("@prisma/client");
    const globalForPrisma = globalThis as any;
    _prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma;
  }
  return _prisma;
}

// Lazy proxy — will throw a helpful error if Prisma isn't generated yet
export const prisma: Record<string, any> = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getPrisma();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);
