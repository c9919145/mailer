import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:dev.db";

  // Neon serverless PostgreSQL (recommended for Vercel)
  if (url.includes("neon.tech")) {
    const adapter = new PrismaNeon({ connectionString: url });
    return new PrismaClient({ adapter });
  }

  // PostgreSQL URLs (used in production on Vercel)
  if (/^postgres(ql)?:\/\//i.test(url)) {
    const adapter = new PrismaPg(url);
    return new PrismaClient({ adapter });
  }

  // SQLite (used for local development without a database server)
  const filePath = url.replace(/^file:/, "");
  const adapter = new PrismaBetterSqlite3({ url: `file:${filePath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
