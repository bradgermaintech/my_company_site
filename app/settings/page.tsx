import { AppShell } from "@/components/app-shell";
import { SettingsProfileForm } from "@/components/settings-profile-form";

export default function SettingsPage() {
  return (
    <AppShell role="admin" active="settings" title="Settings and profile">
      <SettingsProfileForm />
    </AppShell>
  );
}
