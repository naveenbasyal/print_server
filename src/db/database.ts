// src/utils/db.ts
import { PrismaClient } from "../generated/prisma";

declare global {
  var _prisma: PrismaClient | undefined;
}

const db =
  global._prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global._prisma = db;

// Optional safety: disconnect when process exits
process.on("SIGINT", async () => {
  await db.$disconnect();
  process.exit(0);
});

export default db;

