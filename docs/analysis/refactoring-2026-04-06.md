# Weekly Refactoring Analysis — 2026-04-06

**Generated**: 2026-04-06

## Summary

- **Files over 200 lines**: 7
- **Code duplicates**: 15
- **Circular dependencies**: 0
- **Complex functions**: 0
- **Total findings**: 22

## Files Exceeding 200 Lines

Found **7** files exceeding the 200-line limit.

| File | Lines | Over By |
|------|-------|---------|
| `src/components/dashboard/folder-contents.tsx` | 573 | +373 |
| `src/components/dashboard/tree-node.tsx` | 387 | +187 |
| `src/components/admin/freee-credentials-form.tsx` | 385 | +185 |
| `src/lib/freee/api.ts` | 350 | +150 |
| `src/lib/processing/run-processor.ts` | 285 | +85 |
| `src/components/connect/preferences-form.tsx` | 252 | +52 |
| `src/app/api/expense-item/submit-batch/route.ts` | 219 | +19 |

**Recommendation**: Split these files into focused modules with barrel exports (`index.ts`).


## Code Duplication

Found **15** code duplication(s).

| Source A | Source B | Lines | Tokens |
|----------|----------|-------|--------|
| `src/app/api/expense-item/submit/route.ts:1` | `src/app/api/expense-item/submit-batch/route.ts:1` | 15 | ? |
| `src/app/api/expense-item/submit/route.ts:18` | `src/app/api/expense-item/submit-batch/route.ts:13` | 11 | ? |
| `src/app/api/expense-item/submit/route.ts:62` | `src/app/api/expense-item/submit-batch/route.ts:50` | 18 | ? |
| `src/app/api/expense-item/submit/route.ts:151` | `src/app/api/expense-item/submit-batch/route.ts:176` | 17 | ? |
| `src/app/api/expense-item/submit/route.ts:167` | `src/app/api/expense-item/submit-batch/route.ts:192` | 14 | ? |
| `src/app/api/expense-item/delete-freee/route.ts:5` | `src/app/api/expense-item/finalize/route.ts:5` | 15 | ? |
| `src/app/api/expense-item/delete-freee/route.ts:19` | `src/app/api/expense-item/finalize/route.ts:20` | 14 | ? |
| `src/app/api/preferences/route.ts:1` | `src/app/api/runs/route.ts:1` | 12 | ? |
| `src/lib/processing/run-processor.ts:148` | `src/lib/processing/run-processor.ts:13` | 12 | ? |
| `src/lib/processing/run-processor.ts:247` | `src/lib/processing/run-processor.ts:105` | 18 | ? |
| `src/lib/google/drive.ts:69` | `src/lib/google/drive.ts:12` | 14 | ? |
| `src/lib/freee/oauth.ts:109` | `src/lib/freee/oauth.ts:50` | 11 | ? |
| `src/lib/freee/oauth.ts:146` | `src/lib/google/oauth.ts:78` | 13 | ? |
| `src/components/dashboard/tree-node.tsx:320` | `src/components/dashboard/tree-node.tsx:272` | 13 | ? |
| `src/components/dashboard/recent-runs.tsx:5` | `src/components/runs/run-progress.tsx:4` | 13 | ? |

**Recommendation**: Extract shared logic into reusable modules or components.


