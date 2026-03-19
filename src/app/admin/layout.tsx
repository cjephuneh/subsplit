import { AdminSidebar } from "./_components/admin-sidebar";
import { requireAdminUser } from "@/server/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdminUser();

    return (
        <div className="flex min-h-screen bg-white dark:bg-zinc-950">
            <AdminSidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
