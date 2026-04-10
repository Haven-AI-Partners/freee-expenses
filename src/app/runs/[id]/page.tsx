import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import { Header } from "@/components/layout/header";
import { RunProgress } from "@/components/runs/run-progress";
import { ExpenseItemsTable } from "@/components/runs/expense-items-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApproveButton } from "@/components/runs/approve-button";
import { ArrowLeft } from "lucide-react";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const supabase = await createSupabaseClient();

  // RLS ensures user can only see their own runs
  const { data: run } = await supabase
    .from("expense_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (!run) notFound();

  // RLS ensures user can only see items from their own runs
  const { data: items } = await supabase
    .from("expense_items")
    .select("*")
    .eq("run_id", run.id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Expense Run Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RunProgress run={run} items={items || []} />

            {run.status === "extracted" && (
              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  Review the extracted data below, then approve to send to Freee.
                </p>
                <ApproveButton
                  runId={run.id}
                  extractedCount={(items || []).filter((i: { status: string }) => i.status === "extracted").length}
                  totalAmount={run.total_amount}
                />
              </div>
            )}

            <ExpenseItemsTable items={items || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
