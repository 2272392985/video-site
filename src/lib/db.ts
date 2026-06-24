import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "";
  
  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    // Neon PostgreSQL Serverless adapter for production & local development
    const { neonConfig } = require("@neondatabase/serverless");
    const { PrismaNeon } = require("@prisma/adapter-neon");
    const ws = require("ws");
    
    neonConfig.webSocketConstructor = ws;
    
    const adapter = new PrismaNeon({ connectionString: dbUrl });
    return new PrismaClient({ adapter });
  } else {
    // Fallback to standard PrismaClient
    return new PrismaClient();
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
