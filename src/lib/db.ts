import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "";
  const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");
  
  if (isPostgres) {
    // Neon PostgreSQL Serverless adapter for production
    const { neon } = require("@neondatabase/serverless");
    const { PrismaNeon } = require("@prisma/adapter-neon");
    
    const sql = neon(dbUrl);
    const adapter = new PrismaNeon(sql);
    return new PrismaClient({ adapter });
  } else {
    // Local SQLite adapter for development
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
    return new PrismaClient({ adapter });
  }
}

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = createPrismaClient();
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };
