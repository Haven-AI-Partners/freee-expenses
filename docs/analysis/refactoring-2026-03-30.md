# Weekly Refactoring Analysis — 2026-03-30

**Generated**: 2026-03-30

## Summary

- **Files over 200 lines**: 2
- **Code duplicates**: 6
- **Circular dependencies**: 0
- **Complex functions**: 0
- **Total findings**: 8

## Files Exceeding 200 Lines

Found **2** files exceeding the 200-line limit.

| File | Lines | Over By |
|------|-------|---------|
| `src/components/admin/freee-credentials-form.tsx` | 385 | +185 |
| `src/lib/processing/run-processor.ts` | 277 | +77 |

**Recommendation**: Split these files into focused modules with barrel exports (`index.ts`).


## Code Duplication

Found **6** code duplication(s).

| Source A | Source B | Lines | Tokens |
|----------|----------|-------|--------|
| `src/app/api/preferences/route.ts:3` | `src/app/api/runs/trigger/route.ts:4` | 11 | ? |
| `src/lib/processing/run-processor.ts:148` | `src/lib/processing/run-processor.ts:13` | 12 | ? |
| `src/lib/processing/run-processor.ts:239` | `src/lib/processing/run-processor.ts:105` | 18 | ? |
| `src/lib/freee/oauth.ts:108` | `src/lib/freee/oauth.ts:49` | 11 | ? |
| `src/lib/freee/oauth.ts:145` | `src/lib/google/oauth.ts:78` | 13 | ? |
| `src/components/dashboard/recent-runs.tsx:5` | `src/components/runs/run-progress.tsx:4` | 13 | ? |

**Recommendation**: Extract shared logic into reusable modules or components.


