# Weekly Performance Review — 2026-04-24

**Generated**: 2026-04-24

## Summary

- **Large bundle chunks**: 0
- **N+1 query patterns**: 0
- **Missing next/image**: 0
- **Heavy client imports**: 0
- **React perf issues**: 13
- **Missing DB indexes**: 0
- **Total findings**: 13

## Bundle Size Analysis

_No build output found. Run `ANALYZE=true pnpm build` to generate bundle analysis._


## React Performance Issues

Found **13** potential React performance issue(s).

| File | Line | Issue | Description |
|------|------|-------|-------------|
| `src/components/admin/freee-credentials-form.tsx` | 165 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 92 | Inline style object | Creates new object reference on every render |
| `src/components/dashboard/tree-node.tsx` | 99 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 224 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 237 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 319 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 333 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 347 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 379 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 394 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/folder-contents.tsx` | 450 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/folder-contents.tsx` | 468 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/folder-contents.tsx` | 485 | Inline callback prop | Consider useCallback for stable reference |

**Recommendation**: Extract inline objects/callbacks outside the component or wrap with `useMemo`/`useCallback`.


