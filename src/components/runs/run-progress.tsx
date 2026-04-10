"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExpenseRun, ExpenseItem } from "@/types";

const statusVariants: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "secondary",
  running: "warning",
  extracted: "warning",
  submitting: "warning",
  completed: "success",
  failed: "destructive",
};

interface RunProgressProps {
  run: ExpenseRun;
  items?: ExpenseItem[];
}

export function RunProgress({ run, items = [] }: RunProgressProps) {
  const processed = run.submitted_count + run.failed_count;
  const progressPercent = run.total_receipts > 0
    ? Math.round((processed / run.total_receipts) * 100)
    : 0;

  const counts = {
    extracted: items.filter((i) => i.status === "extracted").length,
    draft: items.filter((i) => i.status === "draft").length,
    finalized: items.filter((i) => i.status === "finalized").length,
    failed: items.filter((i) => i.status === "failed").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{run.month}</h3>
          <p className="text-sm text-muted-foreground">
            Created {new Date(run.created_at).toISOString().slice(0, 16).replace("T", " ")}
          </p>
        </div>
        <Badge variant={statusVariants[run.status] || "default"} className="text-sm">
          {run.status}
        </Badge>
      </div>

      {(run.status === "running" || run.status === "submitting") && (
        <div className="space-y-2">
          <Progress value={progressPercent} />
          <p className="text-sm text-muted-foreground">
            {run.status === "running"
              ? `Scanning ${processed}/${run.total_receipts} receipts...`
              : `Submitting ${processed}/${run.total_receipts} to Freee...`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-6 gap-3">
        <div className="text-center p-3 rounded-lg bg-muted">
          <p className="text-2xl font-bold">{run.total_receipts}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-50">
          <p className="text-2xl font-bold text-amber-700">{counts.extracted}</p>
          <p className="text-xs text-muted-foreground">Extracted</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-50">
          <p className="text-2xl font-bold text-amber-700">{counts.draft}</p>
          <p className="text-xs text-muted-foreground">Draft</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-green-50">
          <p className="text-2xl font-bold text-green-700">{counts.finalized}</p>
          <p className="text-xs text-muted-foreground">Finalized</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-red-50">
          <p className="text-2xl font-bold text-red-700">{counts.failed}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-blue-50">
          <p className="text-2xl font-bold text-blue-700">
            ¥{run.total_amount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Amount</p>
        </div>
      </div>
    </div>
  );
}
