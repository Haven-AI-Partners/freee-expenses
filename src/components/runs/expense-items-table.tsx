"use client";

import { Badge } from "@/components/ui/badge";
import { ExpenseItem } from "@/types";

const statusVariants: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "secondary",
  extracted: "warning",
  submitted: "success",
  failed: "destructive",
};

interface ExpenseItemsTableProps {
  items: ExpenseItem[];
}

export function ExpenseItemsTable({ items }: ExpenseItemsTableProps) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">File</th>
            <th className="p-3 text-left font-medium">Date</th>
            <th className="p-3 text-left font-medium">Vendor</th>
            <th className="p-3 text-right font-medium">Amount</th>
            <th className="p-3 text-left font-medium">Category</th>
            <th className="p-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-3 max-w-[200px] truncate">{item.file_name}</td>
              <td className="p-3">{item.extracted_data?.issue_date || "-"}</td>
              <td className="p-3">{item.extracted_data?.partner_name || "-"}</td>
              <td className="p-3 text-right">
                {item.extracted_data?.amount
                  ? `¥${item.extracted_data.amount.toLocaleString()}`
                  : "-"}
              </td>
              <td className="p-3">{item.extracted_data?.account_item_name || "-"}</td>
              <td className="p-3">
                <Badge variant={statusVariants[item.status] || "default"}>
                  {item.status}
                </Badge>
                {item.error_message && (
                  <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                    {item.error_message}
                  </p>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-muted-foreground">
                No items yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
