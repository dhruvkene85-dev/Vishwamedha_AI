let prisma: any = null;

try {
  const mod = await import("@prisma/client");
  const clientFactory = (mod as any).default ?? mod;
  const PrismaClient = clientFactory.PrismaClient ?? clientFactory.default?.PrismaClient;
  if (PrismaClient) {
    prisma = new PrismaClient();
  }
} catch (error) {
  console.warn("[DB] Prisma client unavailable; continuing without generated Prisma bindings.", error);
}

export { prisma };
