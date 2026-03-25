import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getFreeeAuthUrl } from "@/lib/freee/oauth";
import { getGoogleAuthUrl } from "@/lib/google/oauth";
import { Header } from "@/components/layout/header";
import { FreeeConnect } from "@/components/connect/freee-connect";
import { GoogleConnect } from "@/components/connect/google-connect";
import { PreferencesForm } from "@/components/connect/preferences-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
            <CardTitle>Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FreeeConnect
              connected={providers.has("freee")}
              authUrl={getFreeeAuthUrl(userId)}
            />
            <Separator />
            <GoogleConnect
              connected={providers.has("google")}
              authUrl={getGoogleAuthUrl(userId)}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
