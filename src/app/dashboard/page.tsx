import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { Header } from "@/components/layout/header";
import { ConnectionStatus } from "@/components/dashboard/connection-status";
import { RecentRuns } from "@/components/dashboard/recent-runs";
import { RunTrigger } from "@/components/dashboard/run-trigger";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const supabase = await createSupabaseClient();

  // Ensure user exists in DB
  await supabase.from("users").upsert(
    {
      id: userId,
      email: user?.emailAddresses?.[0]?.emailAddress || "",
    },
    { onConflict: "id" }
  );

  // Check Google Drive connection (RLS auto-scopes to current user)
  const { data: connections } = await supabase
    .from("user_connections")
    .select("provider");

  const providers = new Set(connections?.map((c) => c.provider) || []);
  const googleConnected = providers.has("google");

  // Fetch recent runs (RLS auto-scopes to current user)
  const { data: runs } = await supabase
    .from("expense_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <ConnectionStatus googleConnected={googleConnected} />
            <RunTrigger disabled={!googleConnected} />
          </div>
          <div className="md:col-span-2">
            <RecentRuns runs={runs || []} />
          </div>
        </div>
      </main>
    </div>
  );
}
