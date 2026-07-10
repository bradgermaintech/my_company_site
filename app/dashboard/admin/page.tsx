import { redirect } from "next/navigation";

export default function LegacyManagerDashboardRedirectPage() {
  redirect("/dashboard/manager");
}
