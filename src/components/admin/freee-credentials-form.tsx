"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Copy,
  ArrowRight,
} from "lucide-react";

const FREEE_AUTH_URL =
  "https://accounts.secure.freee.co.jp/public_api/authorize";

interface FreeeCredentialsFormProps {
  hasCredentials: boolean;
  freeeConnected: boolean;
  companyId?: string;
  updatedAt?: string;
}

function StepBadge({
  step,
  active,
}: {
  step: number;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {step}
    </span>
  );
}

export function FreeeCredentialsForm({
  hasCredentials: initialHasCredentials,
  freeeConnected: initialConnected,
  companyId: initialCompanyId,
  updatedAt,
}: FreeeCredentialsFormProps) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [companyId, setCompanyId] = useState(initialCompanyId ?? "");
  const [exchanging, setExchanging] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exchangeComplete, setExchangeComplete] = useState(false);
  const [freeeConnected, setFreeeConnected] = useState(initialConnected);
  const [hasCredentials, setHasCredentials] = useState(initialHasCredentials);

  const credentialsReady = clientId.trim() && clientSecret.trim();

  const authUrl = credentialsReady
    ? `${FREEE_AUTH_URL}?${new URLSearchParams({
        client_id: clientId.trim(),
        redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
        response_type: "code",
        prompt: "consent",
      }).toString()}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(authUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExchange = async () => {
    if (!authCode.trim()) {
      setError("Please paste the authorization code from Freee.");
      return;
    }

    setExchanging(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/freee-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
          code: authCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Token exchange failed.");
        return;
      }

      setAccessToken(data.access_token);
      if (data.company_id) setCompanyId(data.company_id);
      setExchangeComplete(true);
      setFreeeConnected(true);
      setHasCredentials(true);
    } catch {
      setError("Token exchange failed. Please try again.");
    } finally {
      setExchanging(false);
    }
  };

  const handleDetectCompany = async () => {
    setDetecting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/freee-detect-company", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to detect company ID.");
        return;
      }

      setCompanyId(data.company_id);
    } catch {
      setError("Failed to detect company ID.");
    } finally {
      setDetecting(false);
    }
  };

  const [showSetup, setShowSetup] = useState(!initialConnected);

  return (
    <div className="space-y-6">
      {/* Connection status */}
      {freeeConnected && !exchangeComplete && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-xs text-muted-foreground">
              Company ID: {companyId || "—"} · Last updated:{" "}
              {updatedAt
                ? new Date(updatedAt).toISOString().slice(0, 16).replace("T", " ")
                : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSetup(!showSetup)}
            >
              {showSetup ? "Hide" : "Reconnect"}
            </Button>
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" /> Connected
            </Badge>
          </div>
        </div>
      )}

      {!showSetup ? null : <>
      {/* Tip banner */}
      <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
        <p className="text-sm">
          You have a <strong>Client ID + Client Secret</strong> — use
          the helper below to exchange them for an access token. Takes
          about 30 seconds.
        </p>
      </div>

      {/* Step 1: App Credentials */}
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <StepBadge step={1} active={true} />
          <h3 className="font-semibold text-sm uppercase tracking-wide">
            Enter your app credentials
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="freee_client_id" className="text-xs font-semibold uppercase">
              Client ID
            </Label>
            <Input
              id="freee_client_id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Freee app client ID"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="freee_client_secret" className="text-xs font-semibold uppercase">
              Client Secret
            </Label>
            <Input
              id="freee_client_secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Freee app client secret"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Open Auth URL */}
      <div
        className={`space-y-3 rounded-lg border p-4 ${
          !credentialsReady ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <StepBadge step={2} active={!!credentialsReady} />
          <h3 className="font-semibold text-sm uppercase tracking-wide">
            Open this URL in your browser &amp; authorize
          </h3>
        </div>

        <div className="flex gap-2">
          <Input
            readOnly
            value={authUrl}
            className="font-mono text-xs bg-muted"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!credentialsReady}
            className="shrink-0 gap-1"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied" : ""}
          </Button>
          <a
            href={authUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={!credentialsReady ? "pointer-events-none" : ""}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={!credentialsReady}
              className="shrink-0 gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </Button>
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          Freee will show you a <strong>one-time authorization code</strong> on
          screen after you log in and approve.
        </p>
      </div>

      {/* Step 3: Paste Code & Exchange */}
      <div
        className={`space-y-4 rounded-lg border p-4 ${
          !credentialsReady ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <StepBadge step={3} active={!!credentialsReady} />
          <h3 className="font-semibold text-sm uppercase tracking-wide">
            Paste the authorization code &amp; exchange
          </h3>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="freee_auth_code" className="text-xs font-semibold uppercase">
            Authorization Code (from Freee)
          </Label>
          <div className="flex gap-2">
            <Input
              id="freee_auth_code"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Paste the code shown by Freee here"
              disabled={exchangeComplete}
            />
            <Button
              onClick={handleExchange}
              disabled={exchanging || !authCode.trim() || exchangeComplete}
              className="shrink-0 gap-2"
            >
              {exchanging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Exchange
            </Button>
          </div>
        </div>

        {/* Post-exchange fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="freee_access_token" className="text-xs font-semibold uppercase">
              Access Token
            </Label>
            <Input
              id="freee_access_token"
              readOnly
              value={accessToken ? "••••••••" : ""}
              placeholder="Auto-filled after exchange above"
              className="bg-muted"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="freee_company_id" className="text-xs font-semibold uppercase">
              Company ID (事業所ID)
            </Label>
            <Input
              id="freee_company_id"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="e.g. 1234567"
            />
          </div>
        </div>

        {/* Company ID helper */}
        <div className="rounded-lg border-l-4 border-muted bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Find your Company ID: log into{" "}
            <strong>freee.co.jp</strong> → 事業所設定 → URLに表示される数字,
            or click &quot;Auto-detect&quot; after getting a token.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 gap-1 text-xs"
            onClick={handleDetectCompany}
            disabled={detecting || (!exchangeComplete && !freeeConnected)}
          >
            {detecting && <Loader2 className="h-3 w-3 animate-spin" />}
            Auto-detect Company ID
          </Button>
        </div>
      </div>

      </>}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Success state */}
      {exchangeComplete && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Freee connected successfully.
            {companyId && ` Company ID: ${companyId}`}
          </p>
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" /> Connected
          </Badge>
        </div>
      )}
    </div>
  );
}
