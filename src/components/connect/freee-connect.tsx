"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink } from "lucide-react";

interface FreeeConnectProps {
  connected: boolean;
  authUrl: string;
}

export function FreeeConnect({ connected, authUrl }: FreeeConnectProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Freee Account</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Freee accounting account to submit expenses
          </p>
        </div>
        {connected && (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" /> Connected
          </Badge>
        )}
      </div>
      {!connected ? (
        <a href={authUrl}>
          <Button className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Connect Freee
          </Button>
        </a>
      ) : (
        <a href={authUrl}>
          <Button variant="outline" size="sm">
            Reconnect
          </Button>
        </a>
      )}
    </div>
  );
}
