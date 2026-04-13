export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { requireAdminUser } from "@/server/auth";

import { AdminPromosClient } from "./ui";

export default async function AdminPromosPage() {
  await requireAdminUser();

  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      creditsCents: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      isActive: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return <AdminPromosClient initialPromos={promos} />;
}
