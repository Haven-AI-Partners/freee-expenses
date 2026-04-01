"use client";

import type { ExtractedReceiptData } from "@/types";
import { formatYen } from "./folder-types";

export function OcrTooltipContent({
  data,
  fileId,
  fileName,
}: {
  data: ExtractedReceiptData;
  fileId: string;
  mimeType: string;
  fileName: string;
}) {
  const drivePreviewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  return (
    <div className="flex flex-col items-center gap-2 text-xs w-[28rem]">
      <iframe
        src={drivePreviewUrl}
        className="w-full h-[28rem] rounded border"
        title={fileName}
        sandbox="allow-scripts allow-same-origin"
      />
      <div className="w-full space-y-1">
        <div className="font-medium">{data.partner_name}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <span className="text-muted-foreground">Date</span>
          <span>{data.issue_date}</span>
          <span className="text-muted-foreground">Amount</span>
          <span>{formatYen(data.amount)}</span>
          <span className="text-muted-foreground">Tax</span>
          <span>{formatYen(data.tax_amount)}</span>
          <span className="text-muted-foreground">Category</span>
          <span>{data.account_item_name}</span>
        </div>
        <div className="text-muted-foreground">{data.description}</div>
      </div>
    </div>
  );
}
