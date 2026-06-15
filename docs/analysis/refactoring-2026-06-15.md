# Weekly Refactoring Analysis — 2026-06-15

**Generated**: 2026-06-15

## Summary

- **Files over 200 lines**: 7
- **Code duplicates**: 18
- **Circular dependencies**: 0
- **Complex functions**: 0
- **Total findings**: 25

## Files Exceeding 200 Lines

Found **7** files exceeding the 200-line limit.

| File | Lines | Over By |
|------|-------|---------|
| `src/components/dashboard/folder-contents.tsx` | 620 | +420 |
| `src/components/dashboard/tree-node.tsx` | 441 | +241 |
| `src/components/admin/freee-credentials-form.tsx` | 385 | +185 |
| `src/lib/freee/api.ts` | 357 | +157 |
| `src/lib/processing/run-processor.ts` | 285 | +85 |
| `src/components/connect/preferences-form.tsx` | 252 | +52 |
| `src/app/api/expense-item/submit-batch/route.ts` | 219 | +19 |

**Recommendation**: Split these files into focused modules with barrel exports (`index.ts`).


## Code Duplication

Found **18** code duplication(s).

| Source A | Source B | Lines | Tokens |
|----------|----------|-------|--------|
| `src/app/api/admin/freee-credentials/route.ts:3` | `src/app/api/expense-item/ocr/route.ts:5` | 14 | 54 |
| `src/app/api/admin/freee-credentials/route.ts:3` | `src/app/api/expense-item/override/route.ts:2` | 14 | 57 |
| `src/app/api/admin/freee-credentials/route.ts:4` | `src/app/api/admin/freee-exchange/route.ts:7` | 14 | 61 |
| `src/app/api/expense-item/delete-freee/route.ts:5` | `src/app/api/expense-item/finalize/route.ts:5` | 13 | 90 |
| `src/app/api/expense-item/delete-freee/route.ts:17` | `src/app/api/expense-item/finalize/route.ts:26` | 11 | 52 |
| `src/app/api/expense-item/submit-batch/route.ts:1` | `src/app/api/expense-item/submit/route.ts:1` | 25 | 177 |
| `src/app/api/expense-item/submit-batch/route.ts:50` | `src/app/api/expense-item/submit/route.ts:62` | 17 | 77 |
| `src/app/api/expense-item/submit-batch/route.ts:176` | `src/app/api/expense-item/submit/route.ts:151` | 17 | 92 |
| `src/app/api/expense-item/submit-batch/route.ts:192` | `src/app/api/expense-item/submit/route.ts:167` | 12 | 56 |
| `src/app/api/preferences/route.ts:1` | `src/app/api/runs/route.ts:1` | 12 | 72 |
| `src/app/dashboard/page.tsx:23` | `src/app/settings/page.tsx:14` | 12 | 56 |
| `src/components/connect/preferences-form.tsx:70` | `src/components/dashboard/folder-contents.tsx:34` | 12 | 97 |
| `src/lib/freee/oauth.ts:50` | `src/lib/freee/oauth.ts:109` | 11 | 64 |
| `src/lib/freee/oauth.ts:146` | `src/lib/google/oauth.ts:78` | 13 | 63 |
| `src/lib/google/drive.ts:12` | `src/lib/google/drive.ts:69` | 13 | 68 |
| `src/lib/google/drive.ts:37` | `src/lib/google/drive.ts:70` | 13 | 65 |
| `src/lib/processing/run-processor.ts:13` | `src/lib/processing/run-processor.ts:148` | 12 | 64 |
| `src/lib/processing/run-processor.ts:105` | `src/lib/processing/run-processor.ts:247` | 22 | 65 |

**Recommendation**: Extract shared logic into reusable modules or components.


