import type { UserRole } from "@/lib/models";

export function getPrimaryDashboardRoute(role: UserRole) {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "bidder":
      return "/dashboard/bidder";
    case "caller":
      return "/dashboard/caller";
    case "developer":
      return "/dashboard/developer";
  }
}
