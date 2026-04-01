import Anthropic from "@anthropic-ai/sdk";
import { ExtractedReceiptData } from "@/types";

const anthropic = new Anthropic();

const EXTRACTION_PROMPT = `You are a receipt data extraction assistant. Analyze this receipt image and extract the following information.
The receipt is likely in Japanese. Return ONLY valid JSON with no additional text.

Required fields:
- issue_date: The date on the receipt in YYYY-MM-DD format
- partner_name: The vendor/store name (in Japanese if available)
- amount: Total amount in yen (integer, no decimals)
- tax_amount: Tax amount in yen (integer, if visible; estimate as 10% of amount if not clearly shown)
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

Example response:
{
  "issue_date": "2025-03-15",
  "partner_name": "スターバックス 渋谷店",
  "amount": 550,
  "tax_amount": 50,
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

  const data = JSON.parse(jsonMatch[0]) as ExtractedReceiptData;

  // Validate required fields
  if (!data.issue_date || !data.partner_name || !data.amount) {
    throw new Error(`Incomplete receipt data extracted: ${JSON.stringify(data)}`);
  }

  return data;
}
