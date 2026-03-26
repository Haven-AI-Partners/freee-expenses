"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";

interface ConnectionStatusProps {
  googleConnected: boolean;
}

export function ConnectionStatus({ googleConnected }: ConnectionStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Google Drive</span>
          {googleConnected ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" /> Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" /> Not connected
            </Badge>
          )}
        </div>
        {!googleConnected && (
          <Link href="/settings">
            <Button variant="outline" size="sm" className="w-full mt-2">
              Connect Google Drive
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
