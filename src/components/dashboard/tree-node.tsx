"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  FileImage,
  FileText,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  ScanEye,
  Send,
  Check,
  X,
  Trash2,
} from "lucide-react";
import type { DriveTreeNode } from "@/lib/google/drive";
import { OcrTooltipContent } from "./ocr-tooltip";
import { type FileState, formatYen, collectReceipts } from "./folder-types";

export interface TreeNodeProps {
  node: DriveTreeNode;
  depth?: number;
  fileIndex?: number;
  fileStates: Record<string, FileState>;
  onOcr: (fileId: string, fileName: string, mimeType: string) => void;
  onSubmit: (fileId: string, fileName: string) => void;
  onDeleteOcr: (fileId: string) => void;
  onOcrAll: (files: DriveTreeNode[]) => void;
  onSubmitAll: (files: DriveTreeNode[]) => void;
  onUpdateAmount: (fileId: string, amount: number) => void;
}

export function TreeNode({
  node,
  depth = 0,
  fileIndex,
  fileStates,
  onOcr,
  onSubmit,
  onDeleteOcr,
  onOcrAll,
  onSubmitAll,
  onUpdateAmount,
}: TreeNodeProps) {
  const [open, setOpen] = useState(true);
  const isFolder = !!node.children;
  const isPdf = node.mimeType === "application/pdf";
  const isReceipt = node.mimeType?.startsWith("image/") || isPdf;
  const state = fileStates[node.id] || {};

  const folderReceipts = isFolder ? collectReceipts(node) : [];
  const folderTotal = folderReceipts.length;
  const folderOcrd = folderReceipts.filter((f) => fileStates[f.id]?.ocrData).length;
  const folderSubmitted = folderReceipts.filter((f) => fileStates[f.id]?.submitted).length;
  const folderAmount = folderReceipts.reduce((sum, f) => {
    const s = fileStates[f.id];
    return sum + (s?.ocrData?.amount || 0);
  }, 0);

  return (
    <div>
      <div
        className="flex items-center gap-1 group"
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
      >
        <button
          type="button"
          className={`flex items-center gap-1.5 flex-1 min-w-0 text-left text-sm py-1 px-1.5 rounded hover:bg-accent transition-colors ${
            isFolder ? "font-medium" : ""
          }`}
          onClick={() => isFolder && setOpen(!open)}
          disabled={!isFolder}
        >
          {isFolder ? (
            open ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            )
          ) : (
            <span className="w-3.5" />
          )}
          {isFolder ? (
            <>
              <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="truncate">{node.name}</span>
              {folderTotal > 0 && (
                <span className="text-xs text-muted-foreground shrink-0 ml-1">
                  {folderOcrd}/{folderTotal} OCR'd
                  {folderSubmitted > 0 && ` · ${folderSubmitted} sent`}
                  {folderAmount > 0 && ` · ${formatYen(folderAmount)}`}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="w-7 shrink-0 text-right text-xs text-muted-foreground tabular-nums mr-2">
                {fileIndex != null ? `${fileIndex}.` : ""}
              </span>
              <span className="w-24 shrink-0 flex items-center text-xs tabular-nums">
                <span className="text-muted-foreground shrink-0">¥</span>
                {state.ocrData ? (
                  <input
                    type="text"
                    className="w-full text-right bg-transparent border-b border-dashed border-muted-foreground/40 hover:border-foreground focus:border-foreground focus:outline-none px-0 py-0 text-xs tabular-nums"
                    defaultValue={state.ocrData.amount.toLocaleString()}
                    key={state.ocrData.amount}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={(e) => {
                      const raw = e.currentTarget.value.replace(/[^0-9]/g, "");
                      const num = parseInt(raw, 10);
                      if (!isNaN(num) && num !== state.ocrData!.amount) {
                        onUpdateAmount(node.id, num);
                      }
                    }}
                  />
                ) : (
                  <span className="w-full text-right text-muted-foreground">—</span>
                )}
              </span>
              {isPdf ? (
                <FileText className="h-4 w-4 text-red-500 shrink-0" />
              ) : (
                <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              {state.ocrData ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate underline decoration-dotted cursor-help">
                      {node.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="p-3">
                    <OcrTooltipContent
                      data={state.ocrData}
                      fileId={node.id}
                      mimeType={node.mimeType}
                      fileName={node.name}
                    />
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="truncate">{node.name}</span>
              )}
            </>
          )}
        </button>

        {isFolder && (
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onOcrAll(collectReceipts(node))}
                >
                  <ScanEye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>OCR all files in folder</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onSubmitAll(collectReceipts(node))}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send all to Freee</TooltipContent>
            </Tooltip>
          </div>
        )}

        {isReceipt && (
          <div className="flex items-center gap-1 shrink-0">
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Preview file</TooltipContent>
              </Tooltip>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm truncate">{node.name}</DialogTitle>
                </DialogHeader>
                <iframe
                  src={`https://drive.google.com/file/d/${node.id}/preview`}
                  className="w-full h-[70vh] rounded border"
                  sandbox="allow-scripts allow-same-origin"
                />
              </DialogContent>
            </Dialog>

            {state.ocrLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : state.ocrError ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <X className="h-4 w-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>{state.ocrError}</TooltipContent>
              </Tooltip>
            ) : state.ocrData ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteOcr(node.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete OCR data</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onOcr(node.id, node.name, node.mimeType)}
                  >
                    <ScanEye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Extract receipt data (OCR)</TooltipContent>
              </Tooltip>
            )}

            {state.submitLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : state.submitted ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : state.submitError ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <X className="h-4 w-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>{state.submitError}</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={!state.ocrData}
                    onClick={() => onSubmit(node.id, node.name)}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {state.ocrData ? "Send to Freee" : "Run OCR first"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
      {isFolder &&
        open &&
        (() => {
          let idx = 0;
          return node.children!.map((child) => {
            const isChildReceipt =
              !child.children &&
              (child.mimeType?.startsWith("image/") || child.mimeType === "application/pdf");
            if (isChildReceipt) idx++;
            return (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                fileIndex={isChildReceipt ? idx : undefined}
                fileStates={fileStates}
                onOcr={onOcr}
                onSubmit={onSubmit}
                onDeleteOcr={onDeleteOcr}
                onOcrAll={onOcrAll}
                onSubmitAll={onSubmitAll}
                onUpdateAmount={onUpdateAmount}
              />
            );
          });
        })()}
    </div>
  );
}
