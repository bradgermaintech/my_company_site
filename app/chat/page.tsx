import { AppShell } from "@/components/app-shell";
import { ChatWorkspace } from "@/components/chat-workspace";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await requireSession();
  const currentUser = {
    id: session.user.id,
    name: session.user.name ?? "AlignOps User",
    email: session.user.email ?? "team@alignops.dev",
    image: session.user.image ?? null,
    role: session.user.role,
    avatar: session.user.avatar,
    active: true
  };

  return (
    <AppShell currentUser={currentUser} role={session.user.role} active="chat" title="Realtime team chat">
      <ChatWorkspace currentUser={currentUser} />
    </AppShell>
  );
}
