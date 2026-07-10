"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import type { UserRole } from "@/lib/models";

const roleRoutes: Record<UserRole, string> = {
  manager: "/dashboard/manager",
  bidder: "/dashboard/bidder",
  caller: "/dashboard/caller",
  developer: "/dashboard/developer"
};

export function RoleSwitcher({ role }: { role: UserRole }) {
  const router = useRouter();

  return (
    <Select
      aria-label="Switch role"
      value={role}
      onChange={(event) => router.push(roleRoutes[event.target.value as UserRole])}
      className="h-9"
    >
      <option value="manager">Manager workspace</option>
      <option value="bidder">Bidder workspace</option>
      <option value="caller">Caller workspace</option>
      <option value="developer">Developer workspace</option>
    </Select>
  );
}
