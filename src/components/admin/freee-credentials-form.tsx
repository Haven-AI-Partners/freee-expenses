"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, Loader2, Save } from "lucide-react";

interface FreeeCredentialsFormProps {
  hasCredentials: boolean;
  freeeConnected: boolean;
  authUrl: string | null;
  companyId?: string;
  updatedAt?: string;
}

export function FreeeCredentialsForm({
  hasCredentials: initialHasCredentials,
  freeeConnected,
  authUrl: initialAuthUrl,
  companyId,
  updatedAt,
}: FreeeCredentialsFormProps) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasCredentials, setHasCredentials] = useState(initialHasCredentials);
  const [authUrl, setAuthUrl] = useState(initialAuthUrl);

  const handleSaveCredentials = async () => {
    if (!clientId || !clientSecret) {
      setMessage("Both Client ID and Client Secret are required.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/freee-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
      });

      if (res.ok) {
        setHasCredentials(true);
        setMessage("Credentials saved! You can now connect to Freee.");
        // Reload to get the fresh auth URL from the server
        window.location.reload();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save credentials.");
      }
    } catch {
      setMessage("Failed to save credentials.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection status */}
      {freeeConnected && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-xs text-muted-foreground">
              Company ID: {companyId} · Last updated:{" "}
              {updatedAt ? new Date(updatedAt).toLocaleString("ja-JP") : "—"}
            </p>
          </div>
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" /> Connected
          </Badge>
        </div>
      )}

      {/* Credentials form */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">
          {hasCredentials ? "Update App Credentials" : "Freee App Credentials"}
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter the Client ID and Client Secret from your Freee app.
          These are used to authenticate with the Freee API.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="freee_client_id">Client ID</Label>
          <Input
            id="freee_client_id"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={hasCredentials ? "••••••••  (saved — enter new value to update)" : "Enter Freee Client ID"}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="freee_client_secret">Client Secret</Label>
          <Input
            id="freee_client_secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={hasCredentials ? "••••••••  (saved — enter new value to update)" : "Enter Freee Client Secret"}
          />
        </div>

        <Button onClick={handleSaveCredentials} disabled={saving} size="sm" className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {hasCredentials ? "Update Credentials" : "Save Credentials"}
        </Button>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>

      {/* OAuth connect button — only shown when credentials are saved */}
      {hasCredentials && authUrl && (
        <div className="pt-2 border-t">
          <a href={authUrl}>
            <Button
              variant={freeeConnected ? "outline" : "default"}
              size="sm"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {freeeConnected ? "Reconnect Freee" : "Connect Freee"}
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
