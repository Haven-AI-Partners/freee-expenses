import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getFreeeAuthUrl } from "@/lib/freee/oauth";
import { getGoogleAuthUrl } from "@/lib/google/oauth";
import { Header } from "@/components/layout/header";
import { GoogleConnect } from "@/components/connect/google-connect";
import { PreferencesForm } from "@/components/connect/preferences-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ExternalLink } from "lucide-react";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { data: connections } = await supabase
    .from("user_connections")
    .select("provider")
    .eq("user_id", userId);

  const providers = new Set(connections?.map((c) => c.provider) || []);

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  const preferences = {
    applicant_name: prefs?.applicant_name || "",
    payment_type: prefs?.payment_type || "employee_pay",
    folder_pattern: prefs?.folder_pattern || "YYYY-MM Expenses",
  };

  // Check if shared Freee connection exists
  const { data: freeeConn } = await supabase
    .from("freee_connection")
    .select("id, company_id, updated_at")
    .eq("id", 1)
    .single();

  const freeeConnected = !!freeeConn;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-3xl font-bold mb-8">Settings</h2>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <PreferencesForm initialPreferences={preferences} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Google Drive</CardTitle>
            <CardDescription>Your personal Google Drive connection.</CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleConnect
              connected={providers.has("google")}
              authUrl={getGoogleAuthUrl(userId)}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Freee Connection (Shared)</CardTitle>
            <CardDescription>
              This is the shared Freee account used by the entire team.
              Only an admin needs to set this up once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status</p>
                {freeeConnected && (
                  <p className="text-xs text-muted-foreground">
                    Company ID: {freeeConn.company_id} · Last updated: {new Date(freeeConn.updated_at).toLocaleString("ja-JP")}
                  </p>
                )}
              </div>
              {freeeConnected ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="destructive">Not connected</Badge>
              )}
            </div>
            <a href={getFreeeAuthUrl()}>
              <Button variant={freeeConnected ? "outline" : "default"} size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {freeeConnected ? "Reconnect Freee" : "Connect Freee (Admin)"}
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
