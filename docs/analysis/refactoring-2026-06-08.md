# Weekly Refactoring Analysis — 2026-06-08

**Generated**: 2026-06-08

## Summary

- **Files over 200 lines**: 7
- **Code duplicates**: 0
- **Circular dependencies**: 0
- **Complex functions**: 0
- **Total findings**: 7

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


