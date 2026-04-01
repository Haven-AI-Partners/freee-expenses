import type { DriveTreeNode } from "@/lib/google/drive";
import type { ExtractedReceiptData } from "@/types";

export interface OcrResultEntry {
  extracted_data: ExtractedReceiptData;
  freee_receipt_id: number | null;
  freee_expense_id: number | null;
}

export interface FolderData {
  tree: DriveTreeNode[];
  folderName: string;
  found: boolean;
  ocrByFileId?: Record<string, OcrResultEntry>;
}

export type FileState = {
  ocrLoading?: boolean;
  ocrData?: ExtractedReceiptData;
  ocrError?: string;
  submitLoading?: boolean;
  submitted?: boolean;
  submitError?: string;
  sectionId?: string;
  approverId?: string;
};

export interface FreeeOption {
  id: number;
  name?: string;
  display_name?: string;
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function collectReceipts(node: DriveTreeNode): DriveTreeNode[] {
  if (node.children) {
    return node.children.flatMap(collectReceipts);
  }
  if (node.mimeType?.startsWith("image/") || node.mimeType === "application/pdf") {
    return [node];
  }
  return [];
}
