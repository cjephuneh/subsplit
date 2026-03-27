export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { requireAdminUser } from "@/server/auth";

import { AdminSupportClient } from "./ui";

export default async function AdminSupportPage() {
  await requireAdminUser();

  const tickets = await prisma.supportTicket.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, email: true, displayName: true } } },
  });

  return <AdminSupportClient initialTickets={tickets} />;
}

