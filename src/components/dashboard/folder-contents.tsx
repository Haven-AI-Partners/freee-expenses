"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FolderOpen, Loader2, ScanEye, Send, RefreshCw, CheckCheck, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import type { DriveTreeNode } from "@/lib/google/drive";
import { TreeNode } from "./tree-node";
import { type FolderData, type FileState, type FreeeOption, formatYen, collectReceipts } from "./folder-types";

export function FolderContents({ month, defaultCollapsed = false }: { month: string; defaultCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [data, setData] = useState<FolderData | null>(null);
  const [loading, setLoading] = useState(!defaultCollapsed);
  const [error, setError] = useState<string | null>(null);
  const [fileStates, setFileStates] = useState<Record<string, FileState>>({});
  const [finalizing, setFinalizing] = useState(false);
  const [deletingFreee, setDeletingFreee] = useState(false);
  const [sections, setSections] = useState<FreeeOption[]>([]);
  const [members, setMembers] = useState<FreeeOption[]>([]);
  const [defaultSectionId, setDefaultSectionId] = useState<string>("");
  const [defaultApproverId, setDefaultApproverId] = useState<string>("");

  useEffect(() => {
    // Fetch Freee sections and members
    fetch("/api/freee-options")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { sections?: FreeeOption[]; members?: FreeeOption[] } | null) => {
        if (data?.sections) setSections(data.sections);
        const fetched = data?.members || [];
        if (!fetched.some((m) => m.id === 13907627)) {
          fetched.push({ id: 13907627, display_name: "Kent Monma" });
        }
        setMembers(fetched);
      })
      .catch(() => {
        setMembers([{ id: 13907627, display_name: "Kent Monma" }]);
      });

    // Fetch user preferences for defaults
    fetch("/api/preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { department?: string; approver_id?: number; applicant_name?: string } | null) => {
        if (data?.department) setDefaultSectionId(data.department);
        if (data?.approver_id) {
          const id = data.approver_id.toString();
          setDefaultApproverId(id);
          // Ensure the approver is in the members list
          setMembers((prev) => {
            if (prev.some((m) => m.id.toString() === id)) return prev;
            return [...prev, { id: data.approver_id!, display_name: id === "13907627" ? "Kent Monma" : `Approver ${id}` }];
          });
        }
      })
      .catch(() => {});
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/folder-files?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: FolderData = await res.json();
      setData(json);

      if (json.ocrByFileId) {
        const restored: Record<string, FileState> = {};
        for (const [fileId, entry] of Object.entries(json.ocrByFileId)) {
          const isSubmitted = !!(entry.freee_receipt_id && entry.freee_expense_id);
          restored[fileId] = {
            ocrData: entry.extracted_data,
            submitted: isSubmitted,
            sectionId: defaultSectionId || undefined,
            approverId: defaultApproverId || undefined,
          };
        }
        setFileStates((prev) => ({ ...restored, ...prev }));
      }
    } catch {
      setError("Could not load folder contents");
    } finally {
      setLoading(false);
    }
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always fetch on mount to check if folder exists
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      setHasFetched(true);
      fetchFiles();
    }
  }, [hasFetched, fetchFiles]);

  // Apply default section/approver when preferences load or files finish loading
  useEffect(() => {
    if (!defaultSectionId && !defaultApproverId) return;
    if (loading) return;
    setFileStates((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        const s = next[key];
        if (s.ocrData) {
          const needsSection = defaultSectionId && !s.sectionId;
          const needsApprover = defaultApproverId && !s.approverId;
          if (needsSection || needsApprover) {
            changed = true;
            next[key] = {
              ...s,
              sectionId: s.sectionId || defaultSectionId || undefined,
              approverId: s.approverId || defaultApproverId || undefined,
            };
          }
        }
      }
      return changed ? next : prev;
    });
  }, [defaultSectionId, defaultApproverId, loading]);

  const updateFileState = useCallback(
    (fileId: string, update: Partial<FileState>) => {
      setFileStates((prev) => ({
        ...prev,
        [fileId]: { ...prev[fileId], ...update },
      }));
    },
    []
  );

  const handleOcr = useCallback(
    async (fileId: string, fileName: string, mimeType: string) => {
      updateFileState(fileId, { ocrLoading: true, ocrError: undefined });
      try {
        const res = await fetch("/api/expense-item/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, fileName, mimeType }),
        });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "OCR failed");
        }
        const { data } = await res.json();
        updateFileState(fileId, {
          ocrLoading: false,
          ocrData: data,
          sectionId: defaultSectionId || undefined,
          approverId: defaultApproverId || undefined,
        });
      } catch (err) {
        updateFileState(fileId, {
          ocrLoading: false,
          ocrError: err instanceof Error ? err.message : "OCR failed",
        });
      }
    },
    [updateFileState, defaultSectionId, defaultApproverId]
  );

  const handleSubmit = useCallback(
    async (fileId: string, fileName: string) => {
      const state = fileStates[fileId];
      if (!state?.ocrData) return;

      updateFileState(fileId, { submitLoading: true, submitError: undefined });
      try {
        const res = await fetch("/api/expense-item/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId,
            fileName,
            extractedData: state.ocrData,
            sectionId: state.sectionId || undefined,
            approverId: state.approverId || undefined,
          }),
        });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "Submission failed");
        }
        updateFileState(fileId, { submitLoading: false, submitted: true });
      } catch (err) {
        updateFileState(fileId, {
          submitLoading: false,
          submitError: err instanceof Error ? err.message : "Submission failed",
        });
      }
    },
    [fileStates, updateFileState]
  );

  const handleOcrAll = useCallback(
    async (files: DriveTreeNode[]) => {
      const pending = files.filter((f) => {
        const s = fileStates[f.id];
        return !s?.ocrData && !s?.ocrLoading;
      });
      for (const file of pending) {
        await handleOcr(file.id, file.name, file.mimeType);
      }
    },
    [fileStates, handleOcr]
  );

  const handleSubmitAll = useCallback(
    async (files: DriveTreeNode[]) => {
      const ready = files.filter((f) => {
        const s = fileStates[f.id];
        return s?.ocrData && !s?.submitted && !s?.submitLoading;
      });
      if (ready.length === 0) return;

      // Mark all as loading
      for (const file of ready) {
        updateFileState(file.id, { submitLoading: true, submitError: undefined });
      }

      try {
        const batchFiles = ready.map((file) => {
          const s = fileStates[file.id]!;
          return {
            fileId: file.id,
            fileName: file.name,
            extractedData: s.ocrData!,
            sectionId: s.sectionId || undefined,
            approverId: s.approverId || undefined,
          };
        });

        const res = await fetch("/api/expense-item/submit-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: batchFiles }),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Batch submit failed");
        }

        // Mark successful files as submitted
        for (const result of json.results || []) {
          for (const fileId of result.fileIds) {
            updateFileState(fileId, { submitLoading: false, submitted: true });
          }
        }

        // Show errors if any
        if (json.errors?.length) {
          setError(`Submit errors: ${json.errors.join(", ")}`);
          // Mark remaining loading files as failed
          for (const file of ready) {
            setFileStates((prev) => {
              const s = prev[file.id];
              if (s?.submitLoading) {
                return { ...prev, [file.id]: { ...s, submitLoading: false, submitError: "Batch failed" } };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        for (const file of ready) {
          updateFileState(file.id, {
            submitLoading: false,
            submitError: err instanceof Error ? err.message : "Submit failed",
          });
        }
      }
    },
    [fileStates, updateFileState]
  );

  const handleUpdateFileOption = useCallback(
    (fileId: string, key: "sectionId" | "approverId", value: string) => {
      setFileStates((prev) => ({
        ...prev,
        [fileId]: { ...prev[fileId], [key]: value },
      }));
    },
    []
  );

  const handleUpdateAmount = useCallback(
    (fileId: string, amount: number) => {
      setFileStates((prev) => {
        const existing = prev[fileId];
        if (!existing?.ocrData) return prev;
        return {
          ...prev,
          [fileId]: {
            ...existing,
            ocrData: { ...existing.ocrData, amount },
          },
        };
      });
    },
    []
  );

  const handleDeleteOcr = useCallback(
    async (fileId: string) => {
      try {
        const res = await fetch("/api/expense-item/ocr", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
        });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "Delete failed");
        }
        setFileStates((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      } catch (err) {
        console.error("Failed to delete OCR result:", err);
      }
    },
    []
  );

  const handleFinalizeAll = useCallback(async () => {
    setFinalizing(true);
    try {
      const res = await fetch("/api/expense-item/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Finalize failed");
      }
      console.log(`Finalized ${json.finalized} expenses`, json.errors?.length ? json.errors : "");
      if (json.finalized === 0 && json.errors?.length) {
        setError(`Finalize errors: ${json.errors.join(", ")}`);
      }
    } catch (err) {
      console.error("Finalize failed:", err);
      setError(err instanceof Error ? err.message : "Finalize failed");
    } finally {
      setFinalizing(false);
    }
  }, []);

  const handleDeleteAll = useCallback(async () => {
    setDeletingFreee(true);
    setError(null);
    try {
      // Delete from Freee if any are submitted
      const anySubmitted = Object.values(fileStates).some((s) => s.submitted);
      if (anySubmitted) {
        const freeeRes = await fetch("/api/expense-item/delete-freee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const freeeJson = await freeeRes.json();
        if (freeeJson.errors?.length) {
          setError(`Freee errors: ${freeeJson.errors.join(", ")}`);
        }
      }

      // Clear all local OCR data
      await fetch("/api/expense-item/ocr", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      setFileStates({});
    } catch (err) {
      console.error("Delete all failed:", err);
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingFreee(false);
    }
  }, [fileStates]);

  const hasSubmitted = Object.values(fileStates).some((s) => s.submitted);

  // Hide if folder doesn't exist
  if (data && !data.found) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <button
            className="flex items-center gap-2 text-lg font-semibold hover:text-accent-foreground transition-colors"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <FolderOpen className="h-5 w-5" />
            {month}
          </button>
          {!collapsed && <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!data?.found}
                  onClick={() => {
                    if (!data?.tree) return;
                    handleOcrAll(data.tree.flatMap(collectReceipts));
                  }}
                >
                  <ScanEye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>OCR all files</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!data?.found}
                  onClick={() => {
                    if (!data?.tree) return;
                    handleSubmitAll(data.tree.flatMap(collectReceipts));
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send all to Freee (as drafts)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!hasSubmitted || finalizing}
                  onClick={handleFinalizeAll}
                >
                  {finalizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Finalize all drafts in Freee</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={Object.keys(fileStates).length === 0 || deletingFreee}
                  onClick={handleDeleteAll}
                >
                  {deletingFreee ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete all (Freee + local data)</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchFiles}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>}
        </CardHeader>
        {!collapsed && <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading folder contents...
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {data && !loading && (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                {data.folderName}
                {!data.found && " — folder not found"}
                {data.found &&
                  (() => {
                    const all = data.tree.flatMap(collectReceipts);
                    const total = all.length;
                    if (total === 0) return null;
                    const ocrd = all.filter((f) => fileStates[f.id]?.ocrData).length;
                    const submitted = all.filter((f) => fileStates[f.id]?.submitted).length;
                    const amount = all.reduce(
                      (s, f) => s + (fileStates[f.id]?.ocrData?.amount || 0),
                      0
                    );
                    return (
                      <span className="ml-2">
                        · {ocrd}/{total} OCR&apos;d
                        {submitted > 0 && ` · ${submitted} sent`}
                        {amount > 0 && ` · ${formatYen(amount)}`}
                      </span>
                    );
                  })()}
              </p>
              {data.found && data.tree.length === 0 && (
                <p className="text-sm text-muted-foreground">Folder is empty.</p>
              )}
              {data.tree.length > 0 && (
                <div className="space-y-0.5">
                  {(() => {
                    let idx = 0;
                    return data.tree.map((node) => {
                      const isNodeReceipt =
                        !node.children &&
                        (node.mimeType?.startsWith("image/") ||
                          node.mimeType === "application/pdf");
                      if (isNodeReceipt) idx++;
                      return (
                        <TreeNode
                          key={node.id}
                          node={node}
                          fileIndex={isNodeReceipt ? idx : undefined}
                          fileStates={fileStates}
                          sections={sections}
                          members={members}
                          onOcr={handleOcr}
                          onSubmit={handleSubmit}
                          onDeleteOcr={handleDeleteOcr}
                          onOcrAll={handleOcrAll}
                          onSubmitAll={handleSubmitAll}
                          onUpdateAmount={handleUpdateAmount}
                          onUpdateFileOption={handleUpdateFileOption}
                        />
                      );
                    });
                  })()}
                </div>
              )}
            </>
          )}
        </CardContent>}
      </Card>
    </TooltipProvider>
  );
}
