"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

interface PreferencesFormProps {
  initialPreferences: {
    applicant_name: string;
    payment_type: string;
    folder_pattern: string;
  };
}

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const [applicantName, setApplicantName] = useState(initialPreferences.applicant_name);
  const [paymentType, setPaymentType] = useState(initialPreferences.payment_type);
  const [folderPattern, setFolderPattern] = useState(initialPreferences.folder_pattern);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: applicantName,
          payment_type: paymentType,
          folder_pattern: folderPattern,
        }),
      });

      if (res.ok) {
        setMessage("Preferences saved!");
      } else {
        setMessage("Failed to save preferences");
      }
    } catch {
      setMessage("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Preferences</h3>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="applicant_name">Applicant Name</Label>
          <Input
            id="applicant_name"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            placeholder="Your name as it appears in Freee"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment_type">Payment Type</Label>
          <Select value={paymentType} onValueChange={setPaymentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee_pay">Employee Pay (立替払い)</SelectItem>
              <SelectItem value="company_pay">Company Pay (会社払い)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="folder_pattern">Folder Name Pattern</Label>
          <Input
            id="folder_pattern"
            value={folderPattern}
            onChange={(e) => setFolderPattern(e.target.value)}
            placeholder="YYYY-MM Expenses"
          />
          <p className="text-xs text-muted-foreground">
            Use YYYY for year and MM for month. Example: &quot;YYYY-MM Expenses&quot; becomes &quot;2026-02 Expenses&quot;
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Preferences
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
