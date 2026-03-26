"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ApproveButtonProps {
  runId: string;
  extractedCount: number;
  totalAmount: number;
}

export function ApproveButton({ runId, extractedCount, totalAmount }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    if (!confirm(
      `Send ${extractedCount} receipt(s) totaling ¥${totalAmount.toLocaleString()} to Freee?`
    )) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/runs/${runId}/approve`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to submit");
        return;
      }
      router.refresh();
    } catch {
      alert("Failed to submit to Freee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleApprove}
      disabled={loading}
      size="lg"
      className="gap-2"
    >
      <Send className="h-4 w-4" />
      {loading ? "Submitting to Freee..." : "Approve & Send to Freee"}
    </Button>
  );
}
