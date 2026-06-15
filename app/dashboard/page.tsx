import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getPrimaryDashboardRoute } from "@/lib/auth-routes";

export const dynamic = "force-dynamic";

export default async function DashboardRouterPage() {
  const session = await requireSession();
  redirect(getPrimaryDashboardRoute(session.user.role));
}
