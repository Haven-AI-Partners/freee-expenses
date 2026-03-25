"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLastMonth } from "@/lib/utils";
import { Loader2, Play } from "lucide-react";

interface RunTriggerProps {
  disabled: boolean;
}

export function RunTrigger({ disabled }: RunTriggerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lastMonth = getLastMonth();

  const handleTrigger = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/runs/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: lastMonth }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Run started for ${lastMonth}. Refresh to see progress.`);
      } else {
        setMessage(data.error || "Failed to start run");
      }
    } catch {
      setMessage("Failed to trigger run");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Run Expenses</CardTitle>
        <CardDescription>
          Process receipts for {lastMonth}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleTrigger}
          disabled={disabled || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Run for {lastMonth}
        </Button>
        {message && (
          <p className="text-sm mt-3 text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
