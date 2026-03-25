import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, FolderOpen, Zap } from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Freee Expenses</h1>
        <Link href="/sign-in">
          <Button>Sign In</Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold tracking-tight mb-6">
            Automate Your Monthly Expenses
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Connect your Google Drive and Freee account. Drop receipt photos in a folder
            and let us handle the rest — extraction, submission, and tracking.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <FolderOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Drop Receipts</CardTitle>
              <CardDescription>
                Save receipt photos to your Google Drive folder. Any image format works.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Auto-Extract</CardTitle>
              <CardDescription>
                AI reads your receipts and extracts dates, amounts, vendors, and categories.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Receipt className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Submit to Freee</CardTitle>
              <CardDescription>
                Expense applications are created in Freee automatically with receipt attachments.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
