import { AppShell } from "@/components/app-shell";
import { SettingsProfileForm } from "@/components/settings-profile-form";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSession();
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
    <AppShell currentUser={currentUser} role={session.user.role} active="settings" title="Settings and profile">
<<<<<<< HEAD
      <SettingsProfileForm currentUser={currentUser} />
=======
      <SettingsProfileForm />
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
    </AppShell>
  );
}
