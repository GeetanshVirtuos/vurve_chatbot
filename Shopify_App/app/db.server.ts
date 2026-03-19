import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaLibSQL({ url: databaseUrl });

const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  if (!global.prisma) {
    global.prisma = prisma;
  }
}

export default prisma;
