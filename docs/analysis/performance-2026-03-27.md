# Weekly Performance Review — 2026-03-27

**Generated**: 2026-03-27

## Summary

- **Large bundle chunks**: 0
- **N+1 query patterns**: 0
- **Missing next/image**: 0
- **Heavy client imports**: 0
- **React perf issues**: 1
- **Missing DB indexes**: 0
- **Total findings**: 1

## Bundle Size Analysis

_No build output found. Run `ANALYZE=true pnpm build` to generate bundle analysis._


## React Performance Issues

Found **1** potential React performance issue(s).

| File | Line | Issue | Description |
|------|------|-------|-------------|
| `src/components/admin/freee-credentials-form.tsx` | 165 | Inline callback prop | Consider useCallback for stable reference |

**Recommendation**: Extract inline objects/callbacks outside the component or wrap with `useMemo`/`useCallback`.


