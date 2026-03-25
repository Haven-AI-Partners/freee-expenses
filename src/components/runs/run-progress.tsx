"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExpenseRun } from "@/types";

const statusVariants: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "secondary",
  running: "warning",
  completed: "success",
  failed: "destructive",
};

interface RunProgressProps {
  run: ExpenseRun;
}

export function RunProgress({ run }: RunProgressProps) {
  const processed = run.submitted_count + run.failed_count;
  const progressPercent = run.total_receipts > 0
    ? Math.round((processed / run.total_receipts) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{run.month}</h3>
          <p className="text-sm text-muted-foreground">
            Created {new Date(run.created_at).toLocaleString("ja-JP")}
          </p>
        </div>
        <Badge variant={statusVariants[run.status] || "default"} className="text-sm">
          {run.status}
        </Badge>
      </div>

      {run.status === "running" && (
        <div className="space-y-2">
          <Progress value={progressPercent} />
          <p className="text-sm text-muted-foreground">
            Processing {processed}/{run.total_receipts} receipts...
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 rounded-lg bg-muted">
          <p className="text-2xl font-bold">{run.total_receipts}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-green-50">
          <p className="text-2xl font-bold text-green-700">{run.submitted_count}</p>
          <p className="text-xs text-muted-foreground">Submitted</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-red-50">
          <p className="text-2xl font-bold text-red-700">{run.failed_count}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-blue-50">
          <p className="text-2xl font-bold text-blue-700">
            ¥{run.total_amount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
    </div>
  );
}
