import { AdminUserManagement } from "@/components/admin-user-management";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [snapshot, session] = await Promise.all([
    getAgencySnapshot(),
    requireRole("admin")
  ]);

  const currentUser = {
    id: session.user.id,
    name: session.user.name ?? "Pipeline User",
    email: session.user.email ?? "team@pipelineos.dev",
    image: session.user.image ?? null,
    role: session.user.role,
    avatar: session.user.avatar,
    active: true
  };

  return (
    <AppShell currentUser={currentUser} role="admin" active="users" title="User management">
      <AdminUserManagement
        applications={snapshot.applications}
        currentUserId={currentUser.id}
        initialUsers={snapshot.users}
        interviews={snapshot.interviews}
      />
    </AppShell>
  );
}
