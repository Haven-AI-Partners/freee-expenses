import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { getFreeeAuthUrl } from "@/lib/freee/oauth";
import { Header } from "@/components/layout/header";
import { FreeeCredentialsForm } from "@/components/admin/freee-credentials-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = await createSupabaseClient();

  // Shared Freee connection — readable by all authenticated users via RLS
  const { data: freeeConn } = await supabase
    .from("freee_connection")
    .select("id, company_id, updated_at, client_id, client_secret")
    .eq("id", 1)
    .single();

  const hasCredentials = !!(freeeConn?.client_id && freeeConn?.client_secret);
  const freeeConnected = !!(freeeConn?.company_id && freeeConn?.updated_at);

  // Only generate auth URL if credentials exist
  let authUrl: string | null = null;
  if (hasCredentials) {
    try {
      authUrl = await getFreeeAuthUrl();
    } catch {
      // Credentials may be invalid — let the form handle it
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-3xl font-bold mb-2">Admin</h2>
        <p className="text-muted-foreground mb-8">
          Manage the shared Freee connection for the entire team.
          Only an admin needs to set this up once.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Freee Connection</CardTitle>
            <CardDescription>
              Enter your Freee app credentials and connect to authorize expense submissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FreeeCredentialsForm
              hasCredentials={hasCredentials}
              freeeConnected={freeeConnected}
              authUrl={authUrl}
              companyId={freeeConn?.company_id ?? undefined}
              updatedAt={freeeConn?.updated_at ?? undefined}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
