import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/layout/header";
import { RunProgress } from "@/components/runs/run-progress";
import { ExpenseItemsTable } from "@/components/runs/expense-items-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default async function RunDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { data: run } = await supabase
    .from("expense_runs")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!run) notFound();

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
            <RunProgress run={run} />
            <ExpenseItemsTable items={items || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
