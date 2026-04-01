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
import { FolderOpen, Loader2, ScanEye, Send, RefreshCw } from "lucide-react";
import type { DriveTreeNode } from "@/lib/google/drive";
import { TreeNode } from "./tree-node";
import { type FolderData, type FileState, formatYen, collectReceipts } from "./folder-types";

export function FolderContents({ month }: { month: string }) {
  const [data, setData] = useState<FolderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileStates, setFileStates] = useState<Record<string, FileState>>({});

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
          restored[fileId] = {
            ocrData: entry.extracted_data,
            submitted: !!(entry.freee_receipt_id && entry.freee_expense_id),
          };
        }
        setFileStates((prev) => ({ ...restored, ...prev }));
      }
    } catch {
      setError("Could not load folder contents");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

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
        updateFileState(fileId, { ocrLoading: false, ocrData: data });
      } catch (err) {
        updateFileState(fileId, {
          ocrLoading: false,
          ocrError: err instanceof Error ? err.message : "OCR failed",
        });
      }
    },
    [updateFileState]
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
      for (const file of ready) {
        await handleSubmit(file.id, file.name);
      }
    },
    [fileStates, handleSubmit]
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

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Drive Folder
          </CardTitle>
          <div className="flex items-center gap-1">
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
              <TooltipContent>Send all to Freee</TooltipContent>
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
          </div>
        </CardHeader>
        <CardContent>
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
                        · {ocrd}/{total} OCR'd
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
                          onOcr={handleOcr}
                          onSubmit={handleSubmit}
                          onDeleteOcr={handleDeleteOcr}
                          onOcrAll={handleOcrAll}
                          onSubmitAll={handleSubmitAll}
                          onUpdateAmount={handleUpdateAmount}
                        />
                      );
                    });
                  })()}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
