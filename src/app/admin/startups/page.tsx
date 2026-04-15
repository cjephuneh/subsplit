import { requireAdminUser } from "@/server/auth";
import { AdminStartupsClient } from "./ui";

export default async function AdminStartupsPage() {
  await requireAdminUser();

  return <AdminStartupsClient />;
}
