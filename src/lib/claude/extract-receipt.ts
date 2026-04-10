import Anthropic from "@anthropic-ai/sdk";
import { ExtractedReceiptData } from "@/types";
import { getFxRateToJpy } from "@/lib/fx";

const anthropic = new Anthropic();

const EXTRACTION_PROMPT = `You are a receipt data extraction assistant. Analyze this receipt image and extract the following information.
The receipt is likely in Japanese but may be in any currency. Return ONLY valid JSON with no additional text.

Required fields:
- issue_date: The date on the receipt in YYYY-MM-DD format
- partner_name: The vendor/store name (in Japanese if available)
- currency: The ISO 4217 currency code of the receipt (e.g. JPY, USD, EUR, GBP). Do NOT convert.
- original_amount: Total amount in the ORIGINAL currency (number, may have decimals for non-JPY)
- original_tax_amount: Tax amount in the ORIGINAL currency (number; estimate as 10% if not shown, 0 for USD/EUR if no tax visible)
- description: Brief description of the purchase (Japanese preferred, e.g. "昼食代", "交通費")
- account_item_name: The accounting category (勘定科目). Must be one of:
  - 交通費 (transportation)
  - 接待交際費 (entertainment)
  - 消耗品費 (supplies)
  - 通信費 (communication)
  - 会議費 (meeting expenses)
  - 旅費交通費 (travel expenses)
  - 食費 (food/meals)
  - その他 (other)

IMPORTANT: Do NOT convert currency. Return amounts in the currency shown on the receipt.

Example response (Japanese receipt):
{
  "issue_date": "2025-03-15",
  "partner_name": "スターバックス 渋谷店",
  "currency": "JPY",
  "original_amount": 550,
  "original_tax_amount": 50,
  "description": "コーヒー代",
  "account_item_name": "会議費"
}

Example response (USD receipt):
{
  "issue_date": "2025-03-15",
  "partner_name": "Starbucks Seattle",
  "currency": "USD",
  "original_amount": 5.75,
  "original_tax_amount": 0.5,
  "description": "コーヒー代",
  "account_item_name": "会議費"
}`;

export async function extractReceiptData(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ExtractedReceiptData> {
  const base64Data = imageBuffer.toString("base64");
  const isPdf = mimeType === "application/pdf";

  const fileContent: Anthropic.ContentBlockParam = isPdf
    ? {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64Data,
        },
      }
    : {
        type: "image",
        source: {
          type: "base64",
          media_type: (mimeType.startsWith("image/")
            ? mimeType
            : "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: base64Data,
        },
      };

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          fileContent,
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON from the response, handling potential markdown code blocks
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse receipt data from Claude response: ${responseText}`);
  }

  const raw = JSON.parse(jsonMatch[0]) as {
    issue_date: string;
    partner_name: string;
    currency?: string;
    original_amount?: number;
    original_tax_amount?: number;
    amount?: number;
    tax_amount?: number;
    description: string;
    account_item_name: string;
  };

  if (!raw.issue_date || !raw.partner_name) {
    throw new Error(`Incomplete receipt data extracted: ${JSON.stringify(raw)}`);
  }

  const currency = (raw.currency || "JPY").toUpperCase();
  const originalAmount = raw.original_amount ?? raw.amount ?? 0;
  const originalTaxAmount = raw.original_tax_amount ?? raw.tax_amount ?? 0;

  if (!originalAmount) {
    throw new Error(`No amount in receipt data: ${JSON.stringify(raw)}`);
  }

  // If already JPY, no conversion needed
  if (currency === "JPY") {
    return {
      issue_date: raw.issue_date,
      partner_name: raw.partner_name,
      amount: Math.round(originalAmount),
      tax_amount: Math.round(originalTaxAmount),
      description: raw.description,
      account_item_name: raw.account_item_name,
    };
  }

  // Convert to JPY using historical rate
  const { rate, date: fxDate } = await getFxRateToJpy(currency, raw.issue_date);

  return {
    issue_date: raw.issue_date,
    partner_name: raw.partner_name,
    amount: Math.round(originalAmount * rate),
    tax_amount: Math.round(originalTaxAmount * rate),
    description: raw.description,
    account_item_name: raw.account_item_name,
    currency,
    original_amount: originalAmount,
    original_tax_amount: originalTaxAmount,
    fx_rate: rate,
    fx_date: fxDate,
  };
}
