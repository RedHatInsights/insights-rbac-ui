# Redux Selectors - Development Rules

## Quick Reference (AI Priority)

### Critical Selector Rules
| Pattern | Correct | Incorrect | Impact |
|---|---|---|---|
| **Selector definition** | `createSelector` in `/redux/*/selectors.ts` | Inline in component | Re-renders on every call |
| **Type safety** | Explicit return types | `as any`, `as string` | Bugs hidden by casts |
| **Base selectors** | Simple property access | `createSelector` for identity | Unnecessary overhead |
| **Error location** | Know list vs single errors | Assume one error location | Wrong error displayed |

### ❌ NEVER DO (Performance/Correctness Breaking)
| Pattern | Problem | Result |
|---|---|-----|
| Inline selectors | Creates new object every render | Infinite re-renders |
| Type casts in selectors | Hides wrong state path | Silent production bugs |
| Identity `createSelector` | No transformation needed | Unnecessary memoization |
| Assume error location | State has dual pattern | Error states don't display |

### ✅ ALWAYS DO
| Pattern | Reason | Example |
|---|-----|---|
| Memoized selectors | Prevent re-renders | `createSelector([base], transform)` |
| Explicit return types | Catch wrong paths | `: string \| undefined` |
| Base for identity | Simple access | `(state) => state.foo` |
| Document error pattern | Clarity | Comment list vs single |

---

## Context

This codebase uses Redux with Reselect for state management. **Selector patterns directly impact performance and correctness.**

### Critical Discovery: Type Casts Hide Bugs
During our session, removing `as string | undefined` casts revealed that error selectors were reading from **wrong Redux state paths**, causing error states to not display in production.

---

## Part 1: Selector Organization

### File Structure
```
src/redux/
├── groups/
│   ├── reducer.ts          # State definition & base selectors
│   ├── selectors.ts        # Memoized selectors (REQUIRED)
│   └── actions.ts
├── roles/
│   ├── reducer.ts
│   ├── selectors.ts        # ALL selectors here
│   └── actions.ts
```

### Where Selectors Live
- ✅ **MUST**: All selectors in `/redux/*/selectors.ts`
- ❌ **NEVER**: Inline selectors in components
- ❌ **NEVER**: Local `reducer` functions in components

---

## Part 2: Selector Patterns

### Base Selectors (Simple State Access)
Use plain functions for direct property access:

```typescript
// ✅ CORRECT - Base selector for simple access
const selectGroupsState = (state: RBACStore) => state.groupReducer?.groups;
const selectIsLoading = (state: RBACStore): boolean => state.groupReducer?.isLoading || false;

// ❌ WRONG - Don't use createSelector for identity
const selectGroupsState = createSelector(
  [(state: RBACStore) => state.groupReducer?.groups],
  (groups) => groups  // Identity function - unnecessary!
);
```

**Rule**: If selector just returns a property unchanged, use a base selector.

---

### Memoized Selectors (Transformations)
Use `createSelector` when transforming, filtering, or computing:

```typescript
// ✅ CORRECT - Memoization prevents re-renders
export const selectGroupsWithDefaults = createSelector(
  [selectGroups, selectAdminGroup, selectSystemGroup],
  (groups, adminGroup, systemGroup): Group[] => {
    const result: Group[] = [];
    if (adminGroup) result.push(adminGroup);
    if (systemGroup) result.push(systemGroup);
    return [...result, ...groups];
  }
);

// ✅ CORRECT - Memoizing object creation
export const selectGroupsPagination = createSelector(
  [selectGroupsState],
  (groupsState): Partial<PaginationDefaultI> => {
    return groupsState?.pagination || groupsState?.meta || { count: 0, limit: 20, offset: 0 };
  }
);
```

**Rule**: If selector transforms, computes, or creates objects/arrays, use `createSelector`.

---

### Type Safety - NO CASTS ALLOWED

```typescript
// ✅ CORRECT - Explicit return type, no casts
const selectGroupsError = (state: RBACStore): ApiError | undefined => 
  state.groupReducer?.groups?.error;

export const selectGroupsListError = selectGroupsError;

// ❌ WRONG - Type cast hides that we're reading from wrong location
const selectGroupsError = (state: RBACStore) => 
  state.groupReducer?.error as string | undefined;  // BUG: Wrong path!
```

**Critical Rule**: If you need a cast, the selector is probably wrong. Type casts revealed production bugs where:
- Error selectors read from `state.error` instead of `state.groups.error`
- Components showed empty states instead of error states
- TypeScript would have caught this without casts

---

## Part 3: The Dual Error Pattern

### Understanding Error State Architecture
Redux state has **TWO error locations** per reducer:

```typescript
export interface GroupStore extends Record<string, unknown> {
  groups: {
    data: Group[];
    meta: PaginationDefaultI;
    error?: ApiError;        // ← LIST operation errors (fetch groups)
  };
  selectedGroup?: {
    uuid: string;
    members?: { error?: ApiError };
    roles?: { error?: ApiError };
  };
  error?: string;            // ← SINGLE resource errors (e.g., BAD_UUID)
  isLoading: boolean;
}
```

### When to Use Each Error Location

| Error Location | Use For | Example | Selector Pattern |
|---|---|---|---|
| `state.groups.error` | List operations | `GET /groups` fails | `selectGroupsListError` |
| `state.error` | Single resource | `GET /groups/BAD_UUID` | `selectGroupError` |
| `state.selectedGroup.members.error` | Nested resource | `GET /groups/:id/members` fails | `selectGroupMembersError` |

### Correct Error Selector Implementation

```typescript
// ✅ CORRECT - Separate selectors for different error types
const selectGroupsState = (state: RBACStore) => state.groupReducer?.groups;
const selectGroupsListError = (state: RBACStore) => 
  state.groupReducer?.groups?.error;  // List errors

const selectGroupError = (state: RBACStore) => 
  state.groupReducer?.error;          // Single resource errors

// Export both with clear names
export const selectGroupsErrorState = selectGroupsListError;
export const selectGroupExists = createSelector(
  [selectGroupError],
  (error) => error !== 'BAD_UUID'
);
```

### Common Mistakes

```typescript
// ❌ WRONG - Reading from wrong error location
const selectGroupsError = (state: RBACStore) => 
  state.groupReducer?.error;  // This is for single resources!

// ❌ WRONG - Ambiguous naming
const selectError = (state: RBACStore) => 
  state.groupReducer?.groups?.error;  // Which error? Be specific!
```

---

## Part 4: Anti-Pattern - Inline Selectors

### The Problem
```typescript
// ❌ CATASTROPHIC - Inline selector in component
export const BadComponent = () => {
  const data = useSelector((state: RBACStore) => ({
    groups: state.groupReducer?.groups?.data || [],
    isLoading: state.groupReducer?.isLoading,
    meta: state.groupReducer?.groups?.meta,
  }));
  // ^ This object is NEW every render → component re-renders infinitely
};
```

**Why this is catastrophic:**
1. Creates new object reference every time
2. `useSelector` sees "different" value each render
3. Component re-renders → selector runs → new object → re-render loop
4. Redux warns: "Selector returned a different result when called with the same parameters"

### The Fix
```typescript
// ✅ CORRECT - Memoized selector
// In selectors.ts
export const selectGroupsData = createSelector(
  [selectGroups, selectIsLoading, selectGroupsMeta],
  (groups, isLoading, meta) => ({
    groups,
    isLoading,
    meta,
  })
);

// In component
export const GoodComponent = () => {
  const data = useSelector(selectGroupsData);
  // ^ Same reference if state unchanged → no unnecessary re-renders
};
```

---

## Part 5: Real-World Bug Examples

### Bug #1: Error Selectors Reading Wrong Path
```typescript
// ❌ PRODUCTION BUG
const selectGroupsError = (state: RBACStore) => 
  state.groupReducer?.error as string | undefined;
  //                    ^ Reading root error, not groups.error!

// Result: When GET /groups API fails, error state doesn't display
// Component shows empty state instead of error state
```

**Fix:**
```typescript
// ✅ CORRECT
const selectGroupsListError = (state: RBACStore): ApiError | undefined => 
  state.groupReducer?.groups?.error;
  //                    ^^^^^^^ Correct path for list errors
```

### Bug #2: Unmemoized Object Creation
```typescript
// ❌ PERFORMANCE BUG
const reducer = ({ serviceAccountReducer }: { serviceAccountReducer: State }) => ({
  serviceAccounts: serviceAccountReducer.serviceAccounts,
  status: serviceAccountReducer.status,
  // ^ New object every call → infinite re-renders
});

export const Component = () => {
  const data = useSelector(reducer);  // Re-renders constantly!
};
```

**Fix:**
```typescript
// ✅ CORRECT - In selectors.ts
export const selectServiceAccountsFullState = createSelector(
  [selectServiceAccounts, selectStatus],
  (serviceAccounts, status) => ({
    serviceAccounts,
    status,
  })
);

// In component
const data = useSelector(selectServiceAccountsFullState);
```

---

## Part 6: Selector Checklist

When creating/reviewing selectors:

### Type Safety ✓
- [ ] No type casts (`as any`, `as string`)
- [ ] Explicit return type declared
- [ ] Correct state path verified
- [ ] Handles undefined/null gracefully

### Performance ✓
- [ ] Base selector for identity access
- [ ] `createSelector` for transformations
- [ ] No inline selectors in components
- [ ] Objects/arrays memoized

### Error Handling ✓
- [ ] Know if list or single resource error
- [ ] Correct error path (`state.error` vs `state.groups.error`)
- [ ] Clear selector naming (`...ListError` vs `...Error`)
- [ ] Comment explains error pattern

### Code Organization ✓
- [ ] All selectors in `/redux/*/selectors.ts`
- [ ] Base selectors at top
- [ ] Memoized selectors below
- [ ] Exported with clear names

---

## Part 7: Migration Pattern

### Converting Inline to Memoized

**Step 1: Identify inline selector**
```typescript
// Component file - BEFORE
const { groups, meta } = useSelector((state: RBACStore) => ({
  groups: state.groupReducer?.groups?.data || [],
  meta: state.groupReducer?.groups?.meta,
}));
```

**Step 2: Create memoized selector**
```typescript
// redux/groups/selectors.ts
export const selectGroupsWithMeta = createSelector(
  [selectGroups, selectGroupsMeta],
  (groups, meta) => ({
    groups,
    meta,
  })
);
```

**Step 3: Update component**
```typescript
// Component file - AFTER
import { selectGroupsWithMeta } from '../../redux/groups/selectors';

const { groups, meta } = useSelector(selectGroupsWithMeta);
```

---

## Part 8: Enforcement Rules

### Code Review Checklist
- ❌ Flag any `useSelector` with inline function creating objects/arrays
- ❌ Flag any type casts in selectors (`as`, `as any`)
- ❌ Flag selectors not in `/redux/*/selectors.ts`
- ❌ Flag identity functions using `createSelector`
- ✅ Require explicit return types on all selectors
- ✅ Require comments explaining dual error pattern

### When to Reject Changes
1. Inline selectors creating objects → "Move to selectors.ts"
2. Type casts in selectors → "Remove cast, fix path"
3. No return type → "Add explicit return type"
4. Wrong error path → "Check if list vs single resource"

---

## Rationale

These rules prevent:
1. **Performance bugs**: Inline selectors cause infinite re-renders
2. **Silent production bugs**: Type casts hide wrong state paths
3. **Maintenance issues**: Scattered selectors hard to find
4. **Type safety erosion**: Casts mask real problems

**Real Impact**: Fixing selector bugs resolved 5 test failures and production error display bugs.

---

## Quick Examples Summary

```typescript
// ✅ Base selector pattern
const selectGroups = (state: RBACStore) => state.groupReducer?.groups?.data;

// ✅ Memoized transformation
export const selectGroupsWithDefaults = createSelector(
  [selectGroups, selectAdminGroup],
  (groups, admin): Group[] => admin ? [admin, ...groups] : groups
);

// ✅ Explicit types, no casts
const selectGroupsListError = (state: RBACStore): ApiError | undefined =>
  state.groupReducer?.groups?.error;

// ✅ In component
const groups = useSelector(selectGroupsWithDefaults);

// ❌ NEVER inline
const groups = useSelector((state) => ({
  data: state.groupReducer?.groups?.data || []  // NEW OBJECT EVERY RENDER!
}));
```

---

## Emergency Fix: "Selector returned different result"

If you see this warning:
1. Find the inline selector in component
2. Move to `/redux/*/selectors.ts` with `createSelector`
3. Import and use in component
4. Test re-rendering stops

**Time to fix**: ~5 minutes per selector
**Impact**: Eliminates infinite re-render bugs

