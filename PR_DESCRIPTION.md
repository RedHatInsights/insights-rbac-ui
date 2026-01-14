# Migration: Redux → TanStack Query (Phase 1: Roles Slice)

## Documentation

- **Detailed Guide**: [docs/architecture/redux-to-tanstack-query.md](./docs/architecture/redux-to-tanstack-query.md)
- **Patterns**: [docs/patterns/](./docs/patterns/)
  - [Query Keys Factory](./docs/patterns/query-keys-factory.md)
  - [Type-Safe Form Submission](./docs/patterns/type-safe-form-submission.md)

## Summary

This PR migrates the Roles slice from Redux to TanStack Query, eliminating 85% of boilerplate code and establishing patterns for server state management.

### Why TanStack Query?

Redux is excellent for **client state** (UI state, preferences), but was never designed for **server state** (API data). Using Redux for APIs creates:

- **Manual cache management** - Must manually refetch after mutations
- **Massive boilerplate** - ~200 lines per endpoint (actions, reducers, selectors)
- **Data freshness bugs** - No automatic background refetching
- **No error recovery** - Must implement retry logic manually

TanStack Query solves these problems with automatic caching, background refetching, and built-in error handling.

### What Changed

**New Architecture (`src/data/`)**:
```
src/data/
├── api/          # Thin API clients (Axios only)
│   ├── client.ts
│   ├── roles.ts
│   ├── permissions.ts
│   ├── cost.ts
│   └── inventory.ts
├── queries/      # TanStack Query hooks
│   ├── client.ts
│   ├── roles.ts
│   ├── permissions.ts
│   ├── cost.ts
│   └── inventory.ts
└── index.ts
```

**Migrated**:
- Roles slice (queries + mutations)
- Permissions API
- Cost Management API
- Inventory API
- Admin group query

**Before vs After**:
```typescript
// Redux: ~200 lines
// - actions/roleActions.js
// - reducers/roleReducer.js
// - selectors/roleSelectors.js
const dispatch = useDispatch();
const roles = useSelector(selectRoles);
const isLoading = useSelector(selectRolesLoading);
useEffect(() => {
  dispatch(fetchRoles({ limit: 20 }));
}, [dispatch]);

// TanStack Query: ~30 lines
const { data, isLoading } = useRolesQuery({ limit: 20, offset: 0 });
```

### Bugs Fixed

1. **Non-admin 403 spam**: Conditional queries prevent unauthorized API calls
2. **Incomplete resource fetching**: `useQueries` fetches all paths in parallel  
3. **Stale data after mutations**: Automatic cache invalidation
4. **Inventory API type mismatches**: Corrected types to match real API
5. **Infinite re-renders**: Fixed empty object comparisons in query params

### Testing

- Build: ✓ Passed
- Lint: ✓ 0 errors
- Unit tests: ✓ 87/87 passed
- Storybook tests: ✓ 788/790 passed

### Migration Phases

- **Phase 1 (This PR)**: Roles slice - establishes patterns
- **Phase 2**: Groups slice
- **Phase 3**: Users slice  
- **Phase 4**: Remove Redux entirely, document bundle size reduction

---

## Key Patterns Established

See [docs/patterns/](./docs/patterns/) for detailed guides.

### Query Keys Factory

Centralized, hierarchical query keys for reliable cache invalidation:

```typescript
export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (params: ListRolesParams) => [...rolesKeys.lists(), params] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: string) => [...rolesKeys.details(), id] as const,
};

// Invalidate all roles queries
queryClient.invalidateQueries({ queryKey: rolesKeys.all });
```

### Mutation with Cache Invalidation

Automatic cache invalidation and notifications:

```typescript
export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roleIn: RoleIn) => {
      const response = await rolesApi.createRole({ roleIn });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      // Notification handled automatically
    },
  });
}
```

### Type-Safe Form Submission

Runtime validation + compile-time type safety:

```typescript
interface AddRoleFormData extends Record<string, unknown> {
  'role-name': string;
  'add-permissions-table': Array<{ uuid: string }>;
}

function isAddRoleFormData(data: Record<string, unknown>): data is AddRoleFormData {
  return typeof data['role-name'] === 'string' && Array.isArray(data['add-permissions-table']);
}

const onSubmit = (formData: Record<string, unknown>) => {
  if (!isAddRoleFormData(formData)) return;
  const { 'role-name': name } = formData;  // Fully type-safe!
};
```

---

## Developer Experience

**Reduced Cognitive Load**:
- No Redux boilerplate
- No manual cache management  
- Automatic loading/error states
- Built-in background refetching

**Better Debugging**:
- TanStack Query DevTools (development only)
- Real-time cache inspection
- Network request deduplication tracking

**Faster Development**:
- Add endpoint: 1 API function + 1 hook = done
- Mutations handle notifications automatically
- Type-safe by default
- MSW handlers in Storybook

---

## Breaking Changes

None. Redux coexists during migration. Groups and Users still use Redux and will be migrated in Phase 2 and 3.

---

## References

- [Detailed Migration Guide](./docs/architecture/redux-to-tanstack-query.md)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- Reference Implementation: `src/data/queries/roles.ts`
