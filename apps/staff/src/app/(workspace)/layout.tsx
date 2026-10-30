import { requireInternalUser } from "@/lib/require-internal-user";

export default async function StaffWorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireInternalUser();
  return children;
}
