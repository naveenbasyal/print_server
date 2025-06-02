// src/utils/db.ts
import { PrismaClient } from "../generated/prisma";

declare global {
  var _prisma: PrismaClient | undefined;
}

const prisma =
  global._prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global._prisma = prisma;

// Optional safety: disconnect when process exits
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

