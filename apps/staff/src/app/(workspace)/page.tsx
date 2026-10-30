import { requireInternalUser } from "@/lib/require-internal-user";
import { StaffDashboard } from "./staff-dashboard";

export default async function StaffHomePage() {
  const user = await requireInternalUser();
  return <StaffDashboard name={user.displayName || user.email} role={user.role} />;
}

