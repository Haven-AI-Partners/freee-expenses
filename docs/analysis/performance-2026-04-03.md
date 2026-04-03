# Weekly Performance Review — 2026-04-03

**Generated**: 2026-04-03

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
| `src/components/dashboard/folder-contents.tsx` | 405 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/folder-contents.tsx` | 423 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/folder-contents.tsx` | 440 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 86 | Inline style object | Creates new object reference on every render |
| `src/components/dashboard/tree-node.tsx` | 93 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 184 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 197 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 279 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 293 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 307 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 327 | Inline callback prop | Consider useCallback for stable reference |
| `src/components/dashboard/tree-node.tsx` | 342 | Inline callback prop | Consider useCallback for stable reference |

**Recommendation**: Extract inline objects/callbacks outside the component or wrap with `useMemo`/`useCallback`.


