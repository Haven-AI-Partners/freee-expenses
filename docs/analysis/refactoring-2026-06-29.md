# Weekly Refactoring Analysis — 2026-06-29

**Generated**: 2026-06-29

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
| `app/api/admin/freee-credentials/route.ts:3` | `app/api/expense-item/ocr/route.ts:5` | 14 | 54 |
| `app/api/admin/freee-credentials/route.ts:3` | `app/api/expense-item/override/route.ts:2` | 14 | 57 |
| `app/api/admin/freee-credentials/route.ts:4` | `app/api/admin/freee-exchange/route.ts:7` | 14 | 61 |
| `app/api/expense-item/delete-freee/route.ts:5` | `app/api/expense-item/finalize/route.ts:5` | 13 | 90 |
| `app/api/expense-item/delete-freee/route.ts:17` | `app/api/expense-item/finalize/route.ts:26` | 11 | 52 |
| `app/api/expense-item/submit-batch/route.ts:1` | `app/api/expense-item/submit/route.ts:1` | 25 | 177 |
| `app/api/expense-item/submit-batch/route.ts:50` | `app/api/expense-item/submit/route.ts:62` | 17 | 77 |
| `app/api/expense-item/submit-batch/route.ts:176` | `app/api/expense-item/submit/route.ts:151` | 17 | 92 |
| `app/api/expense-item/submit-batch/route.ts:192` | `app/api/expense-item/submit/route.ts:167` | 12 | 56 |
| `app/api/preferences/route.ts:1` | `app/api/runs/route.ts:1` | 12 | 72 |
| `app/dashboard/page.tsx:23` | `app/settings/page.tsx:14` | 12 | 56 |
| `components/connect/preferences-form.tsx:70` | `components/dashboard/folder-contents.tsx:34` | 12 | 97 |
| `lib/freee/oauth.ts:50` | `lib/freee/oauth.ts:109` | 11 | 64 |
| `lib/freee/oauth.ts:146` | `lib/google/oauth.ts:78` | 13 | 63 |
| `lib/google/drive.ts:12` | `lib/google/drive.ts:69` | 13 | 68 |
| `lib/google/drive.ts:37` | `lib/google/drive.ts:70` | 13 | 65 |
| `lib/processing/run-processor.ts:13` | `lib/processing/run-processor.ts:148` | 12 | 64 |
| `lib/processing/run-processor.ts:105` | `lib/processing/run-processor.ts:247` | 22 | 65 |

**Recommendation**: Extract shared logic into reusable modules or components.


