import { describe, it, expect } from "vitest";
import { formatMonth, resolveFolderName, getLastMonth } from "./utils";

describe("formatMonth", () => {
  it("formats a date as YYYY-MM", () => {
    expect(formatMonth(new Date(2025, 0, 15))).toBe("2025-01");
    expect(formatMonth(new Date(2025, 11, 1))).toBe("2025-12");
  });

  it("pads single-digit months", () => {
    expect(formatMonth(new Date(2025, 2, 1))).toBe("2025-03");
  });
});

describe("resolveFolderName", () => {
  it("replaces YYYY and MM placeholders", () => {
    expect(resolveFolderName("receipts/YYYY/MM", "2025-03")).toBe("receipts/2025/03");
  });

  it("handles patterns without placeholders", () => {
    expect(resolveFolderName("static-folder", "2025-03")).toBe("static-folder");
  });
});

describe("getLastMonth", () => {
  it("returns a valid YYYY-MM string", () => {
    const result = getLastMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });
});
