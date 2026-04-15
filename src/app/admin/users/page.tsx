import { requireAdminUser } from "@/server/auth";
import { AdminUsersClient } from "./ui";

export default async function AdminUsersPage() {
  await requireAdminUser();

  return <AdminUsersClient />;
}
