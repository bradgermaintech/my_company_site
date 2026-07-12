"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { disconnectPusherClient } from "@/lib/pusher-client";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        disconnectPusherClient();
        void signOut({ callbackUrl: "/login" });
      }}
    >
      <LogOut className="size-4" aria-hidden="true" />
      Sign out
    </Button>
  );
}
