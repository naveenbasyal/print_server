import { PrismaClient } from "../generated/prisma";


const db = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

export default db;
