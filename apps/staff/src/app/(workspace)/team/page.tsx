import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/require-internal-user";
import { createClient } from "@/lib/supabase/server";
import { TeamManager, type TeamAccount } from "./team-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team · CHICC Staff" };

type TeamPageProps = { searchParams: Promise<{ notice?: string }> };

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const user = await requireInternalUser();
  if (user.role !== "manager") redirect("/");

  const supabase = await createClient();
  const [{ data, error }, params] = await Promise.all([
    supabase.rpc("list_internal_accounts"),
    searchParams,
  ]);
  const members = (data ?? []) as TeamAccount[];

  return <TeamManager members={members} loadError={Boolean(error)} notice={params.notice ?? null} />;
}
