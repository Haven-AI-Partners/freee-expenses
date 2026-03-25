import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getGoogleAuthUrl } from "@/lib/google/oauth";
import { Header } from "@/components/layout/header";
import { GoogleConnect } from "@/components/connect/google-connect";
import { PreferencesForm } from "@/components/connect/preferences-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ConnectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Check existing Google connection
  const { data: connections } = await supabase
    .from("user_connections")
    .select("provider")
    .eq("user_id", userId);

  const providers = new Set(connections?.map((c) => c.provider) || []);
  const googleConnected = providers.has("google");

  // Load preferences
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

  // Generate Google OAuth URL
  const googleAuthUrl = getGoogleAuthUrl(userId);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-3xl font-bold mb-2">Connect Your Account</h2>
        <p className="text-muted-foreground mb-8">
          Connect Google Drive and set your preferences to start automating expenses.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Connect Google Drive</CardTitle>
            <CardDescription>
              Allow read-only access to scan your receipt folders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleConnect connected={googleConnected} authUrl={googleAuthUrl} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Step 2: Set Preferences</CardTitle>
            <CardDescription>
              Configure how your expenses are submitted to Freee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PreferencesForm initialPreferences={preferences} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
