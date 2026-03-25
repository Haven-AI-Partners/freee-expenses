"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpenseRun } from "@/types";

const statusVariants: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "secondary",
  running: "warning",
  completed: "success",
  failed: "destructive",
};

interface RecentRunsProps {
  runs: ExpenseRun[];
}

export function RecentRuns({ runs }: RecentRunsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Runs</CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs yet. Trigger your first expense run!</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{run.month}</p>
                  <p className="text-xs text-muted-foreground">
                    {run.submitted_count}/{run.total_receipts} receipts
                    {run.total_amount > 0 && ` · ¥${run.total_amount.toLocaleString()}`}
                  </p>
                </div>
                <Badge variant={statusVariants[run.status] || "default"}>
                  {run.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
