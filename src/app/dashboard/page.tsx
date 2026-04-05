import { redirect } from "next/navigation";

import { getSessionUser } from "@/server/auth";
import { DashboardClient } from "@/app/dashboard/_components/dashboard-client";
import { getDashboardData } from "@/app/dashboard/_data";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const data = await getDashboardData(user.id);

  return (
    <DashboardClient
      user={user}
      wallet={{
        balanceCents: data.wallet.balanceCents,
        lowBalanceCentsThreshold: data.wallet.lowBalanceCentsThreshold,
      }}
      models={data.models}
      initialTransactions={data.transactions}
      initialNotifications={data.notifications}
      initialKeys={data.apiKeys}
    />
  );
}

