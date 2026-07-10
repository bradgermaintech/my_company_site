import type { UserRole } from "@/lib/models";

export function getPrimaryDashboardRoute(role: UserRole) {
  switch (role) {
    case "manager":
      return "/dashboard/manager";
    case "bidder":
      return "/dashboard/bidder";
    case "caller":
      return "/dashboard/caller";
    case "developer":
      return "/dashboard/developer";
    default:
      return "/dashboard/bidder";
  }
}
