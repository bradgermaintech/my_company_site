import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/auth";
import { getPrimaryDashboardRoute } from "@/lib/auth-routes";
import type { UserRole } from "@/lib/models";

export async function requireSession() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireSession();

  if (session.user.role !== role) {
    redirect(getPrimaryDashboardRoute(session.user.role));
  }

  return session;
}
