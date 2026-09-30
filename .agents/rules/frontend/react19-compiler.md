---
trigger:
  glob: "src/**/*.{ts,tsx}"
description: React 19 compiler compliance and rendering purity rule.
---

# React 19 & Compiler Compliance Rule

The codebase runs on **React 19** with strict Oxlint rules. Maintain compiler purity and avoid anti-patterns:

### 1. Rendering Purity
- **No impure calls in render:** Do not invoke `Date.now()`, `Math.random()`, or mutate external variables inside component render bodies. Derive values inside effects or callbacks, or wrap them in stable state.
- **No state mutation:** Never mutate React state objects or arrays in-place (e.g., `activeAudio.currentTime = 0` when `activeAudio` comes from `useState`). Always use functional state setters.

### 2. Effects & Dependencies
- **No synchronous `setState` in `useEffect`:** Do not call `setState` synchronously within the top-level body of a `useEffect` unless synchronizing with an external non-React subscription. Derive state during render instead.
- **Exhaustive dependencies:** Always supply accurate dependency arrays to `useEffect`, `useMemo`, and `useCallback`. If a dependency changes every render, stabilize it with `useRef` or `useCallback`.

### 3. Suspense & Code Splitting
- New modal components and heavy hubs must be lazy-loaded using `React.lazy()` and encapsulated in existing `<Suspense fallback={null}>` boundaries in `src/App.tsx`.
