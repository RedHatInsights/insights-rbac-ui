# Redux to TanStack Query Migration

**Status:** Phase 4 In Progress (Groups Slice)  
**Last Updated:** 2026-01-19  
**Owner:** Engineering Team  

## Quick Links

- [Query Keys Factory Pattern](../patterns/query-keys-factory.md)
- [Type-Safe Form Submission Pattern](../patterns/type-safe-form-submission.md)
- [TanStack Query Official Docs](https://tanstack.com/query/latest)

---

## Table of Contents

1. [Why We Migrated](#why-we-migrated)
2. [Core Concepts](#core-concepts)
3. [Architecture Overview](#architecture-overview)
4. [Migration Status](#migration-status)
5. [Standard Patterns](#standard-patterns)
6. [Developer Guide](#developer-guide)
7. [Testing](#testing)
8. [Type Safety](#type-safety)
9. [Troubleshooting](#troubleshooting)

---

## Why We Migrated

### The Problem with Redux for Server State

Redux is excellent for **client-side application state** (UI state, user preferences, form state), but it was never designed to manage **server state** (data from APIs). Using Redux for server state created:

1. **Manual Cache Management**
   - Must manually fetch data on mount
   - Must manually refetch after mutations
   - Must manually handle stale data
   - Easy to forget = stale data bugs

2. **Boilerplate Explosion**
   - ~200 lines per endpoint (actions, reducers, selectors)
   - Async middleware complexity
   - Repetitive patterns across all slices

3. **No Built-in Features**
   - No automatic background refetching
   - No request deduplication
   - No retry logic
   - No cache invalidation patterns

### The Solution: TanStack Query

TanStack Query is a **server state management library** that treats API data as a cache, not as global state. It provides:

- Automatic caching and background refetching
- Request deduplication
- Optimistic updates
- Retry logic
- Cache invalidation patterns
- Built-in loading and error states
- 85% less boilerplate code

---

## Core Concepts

### Queries (Reading Data)

Queries are for **fetching** data. They are cached, automatically refetched when stale, and deduplicated.

```typescript
const { data, isLoading, error } = useRolesQuery({ limit: 20, offset: 0 });
```

TanStack Query automatically:
- Fetches the data on mount
- Caches the result
- Refetches when the data becomes stale
- Deduplicates identical requests (same query key)
- Provides loading and error states

### Mutations (Writing Data)

Mutations are for **creating, updating, or deleting** data. They can invalidate queries to trigger refetches.

```typescript
const createRole = useCreateRoleMutation();
createRole.mutate({ name: 'New Role', access: [] });
```

TanStack Query automatically:
- Calls the API
- Provides loading state
- Invalidates related queries (configured in `onSuccess`)
- Shows notifications (configured in `onSuccess`/`onError`)

### Query Keys (Cache Addresses)

Query keys uniquely identify cached data. They use a hierarchical structure for easy invalidation.

```typescript
['roles']                              // All roles data
['roles', 'list', { limit: 20 }]      // Specific roles list
['roles', 'detail', 'role-123']       // Single role

// Invalidate all roles queries
queryClient.invalidateQueries({ queryKey: ['roles'] });
```

See [Query Keys Factory Pattern](../patterns/query-keys-factory.md) for details.

### Automatic Background Refetching

TanStack Query refetches data when:
- Data becomes "stale" (configurable via `staleTime`)
- Window regains focus
- Network reconnects
- You explicitly invalidate

**You never manually refetch.** The cache is always fresh.

---

## Architecture Overview

### Directory Structure

```
src/data/
├── api/                    # Thin API clients (Axios calls only)
│   ├── client.ts           # Axios instance configuration
│   ├── roles.ts            # Roles API functions
│   ├── groups.ts           # Groups API functions
│   ├── permissions.ts      # Permissions API functions
│   ├── cost.ts             # Cost Management API
│   ├── inventory.ts        # Inventory API
│   └── index.ts            # Barrel exports
│
├── queries/                # TanStack Query hooks
│   ├── client.ts           # QueryClient configuration
│   ├── roles.ts            # useRolesQuery, useCreateRoleMutation, etc.
│   ├── groups.ts           # useGroupsQuery, etc.
│   ├── permissions.ts      # usePermissionsQuery, etc.
│   ├── cost.ts             # useResourceTypesQuery, etc.
│   ├── inventory.ts        # useInventoryGroupsQuery, etc.
│   └── index.ts            # Barrel exports
│
└── index.ts                # Main barrel export
```

### Three-Layer Architecture

**Layer 1: API Client (Pure Axios)**
```typescript
// src/data/api/roles.ts
export const rolesApi = APIFactory(RBAC_API_BASE, roleEndpoints, { axios: apiClient });
```
- No React hooks
- No state management
- Returns raw Axios responses
- Reusable outside React

**Layer 2: Query Hooks (TanStack Query)**
```typescript
// src/data/queries/roles.ts
export function useRolesQuery(params: ListRolesParams) {
  return useQuery({
    queryKey: rolesKeys.list(params),
    queryFn: async () => {
      const response = await rolesApi.listRoles(params);
      return response.data;
    },
  });
}
```
- Wraps API with TanStack Query
- Manages caching and loading states
- Type-safe
- React-specific

**Layer 3: Components (Pure Consumers)**
```typescript
// src/features/roles/Roles.tsx
const { data, isLoading } = useRolesQuery({ limit: 20, offset: 0 });
```
- No dispatch calls
- No selectors
- Just use the hook

---

## Migration Status

### Phase 0: Type Safety Audit (COMPLETE)

Fixed non-Redux type casts (`as any`, `as unknown`) across 8 files to establish type-safe foundation.

### Phase 1: Roles Slice (COMPLETE)

**Queries:**
- `useRolesQuery` - List roles with pagination/filtering
- `useRoleQuery` - Fetch single role by ID
- `useRoleForPrincipalQuery` - Fetch roles for a specific principal

**Mutations:**
- `useCreateRoleMutation` - Create new role
- `useUpdateRoleMutation` - Update entire role
- `usePatchRoleMutation` - Partial role update
- `useDeleteRoleMutation` - Delete role(s)

**Related APIs:**
- Permissions API (complete)
- Cost Management API (complete)
- Inventory API (complete)
- Groups API (admin group only)

### Phase 2: Users Slice (COMPLETE)

**Queries:**
- `useUsersQuery` - List users with pagination/filtering/sorting

**Mutations:**
- `useChangeUserStatusMutation` - Activate/deactivate users
- `useInviteUsersMutation` - Invite new users via email
- `useUpdateUserOrgAdminMutation` - Toggle org admin status

**Migrated Components:**
- `UsersListNotSelectable.tsx` - Main users table (migrated from Redux `fetchUsers`, `changeUsersStatus`)
- `OrgAdminDropdown.tsx` - Org admin toggle
- `InviteUsersModal.tsx` - User invitation modal
- `AddUserToGroup.tsx` - Add user to group modal

**Key Learnings:**
- Must preserve dynamic base URL logic from `fetchEnvBaseUrl()`
- Sort direction must be extracted from `-` prefix in orderBy
- Account ID types vary by component (`number` vs `string`)

### Phase 3: My User Access (COMPLETE)

**Queries:**
- `usePrincipalAccessQuery` - Fetch permissions for current user

**Migrated Components:**
- `AccessTable.tsx` - Permissions table
- `RolesTable.tsx` - Roles table with expandable permissions

### Phase 4: Groups Slice (IN PROGRESS)

- Full groups CRUD operations
- Group memberships
- Group-role associations

### Phase 5: Workspaces Slice (PLANNED)

- Workspace management
- Role bindings

### Phase 6: Redux Removal (PLANNED)

- Remove Redux dependencies
- Delete Redux files
- Update documentation
- Bundle size reduction verification

---

## Standard Patterns

We've established several patterns for consistency across the codebase.

### 1. Query Keys Factory

See [Query Keys Factory Pattern](../patterns/query-keys-factory.md) for full details.

```typescript
export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (params: ListRolesParams) => [...rolesKeys.lists(), params] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: string) => [...rolesKeys.details(), id] as const,
};
```

### 2. Mutation with Cache Invalidation

```typescript
export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();

  return useMutation({
    mutationFn: async (roleIn: RoleIn) => {
      const response = await rolesApi.createRole({ roleIn });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      // Notification added automatically
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: 'Failed to create role',
      });
    },
  });
}
```

### 3. Type-Safe Form Submission

See [Type-Safe Form Submission Pattern](../patterns/type-safe-form-submission.md) for full details.

### 4. Parallel Queries

Use `useQueries` for fetching multiple resources in parallel:

```typescript
const resourceQueries = useQueries({
  queries: resourcePaths.map((path) => ({
    queryKey: costKeys.resourceDetail({ path }),
    queryFn: () => getResource({ path }),
    enabled: !!path,
  })),
});
```

### 5. Conditional Queries

Use the `enabled` option to conditionally fetch data:

```typescript
// Only fetch if user has permission
const { data } = useRolesQuery(params, { enabled: isAdmin });

if (!isAdmin) {
  return <UnauthorizedAccess />;
}
```

---

## Developer Guide

### Adding a New Query

1. **Define API function** (`src/data/api/`)
```typescript
export async function listRoles(params: ListRolesParams) {
  const response = await rolesApi.listRoles(params);
  return response.data;
}
```

2. **Add query key** (`src/data/queries/roles.ts`)
```typescript
export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (params: ListRolesParams) => [...rolesKeys.lists(), params] as const,
};
```

3. **Create query hook** (`src/data/queries/roles.ts`)
```typescript
export function useRolesQuery(params: ListRolesParams) {
  return useQuery({
    queryKey: rolesKeys.list(params),
    queryFn: async () => {
      const response = await rolesApi.listRoles(params);
      return response.data;
    },
  });
}
```

4. **Use in component**
```typescript
const { data, isLoading, error } = useRolesQuery({ limit: 20, offset: 0 });
```

### Adding a New Mutation

1. **Define API function** (if not already defined)
2. **Create mutation hook** (`src/data/queries/roles.ts`)
```typescript
export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();

  return useMutation({
    mutationFn: async (roleIn: RoleIn) => {
      const response = await rolesApi.createRole({ roleIn });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      addNotification({
        variant: 'success',
        title: 'Role created successfully',
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: 'Failed to create role',
      });
    },
  });
}
```

3. **Use in component**
```typescript
const createRole = useCreateRoleMutation();

const handleSubmit = () => {
  createRole.mutate({ name: 'New Role', access: [] });
};
```

---

## Testing

### Storybook Stories

All components should have Storybook stories with:
- MSW handlers for API mocking
- Play functions for interaction testing
- Proper query client isolation

```typescript
export const CreateRole: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/rbac/v1/roles/', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ ...body, uuid: 'new-role-123' });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Role name'), 'Test Role');
    await userEvent.click(canvas.getByRole('button', { name: /create/i }));
    
    expect(await canvas.findByText('Role created successfully')).toBeInTheDocument();
  },
};
```

### Query Client Isolation

The Storybook decorator automatically provides a fresh `QueryClient` per story:

```typescript
// .storybook/preview.tsx
const decorator: Decorator = (Story, context) => {
  const testQueryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={testQueryClient}>
      <Story />
    </QueryClientProvider>
  );
};
```

### MSW Handlers

MSW handlers should accurately reflect the real API behavior from staging:

```typescript
http.get('/api/rbac/v1/roles/', ({ request }) => {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit')) || 20;
  const offset = Number(url.searchParams.get('offset')) || 0;
  
  return HttpResponse.json({
    meta: { count: mockRoles.length },
    data: mockRoles.slice(offset, offset + limit),
  });
}),
```

**Important:** Always verify types against staging API. Client library types are known to be incorrect.

---

## Type Safety

### Strict Type Safety Rules

- **Zero `any` types** in migrated code
- Explicit generic types for all query hooks
- Type guards for runtime validation
- `as const` assertions for query keys

### Known Issues with Client Libraries

The `@redhat-cloud-services/rbac-client` and `@redhat-cloud-services/host-inventory-client` types are known to be incorrect.

**Our approach:**
- Document discrepancies with comments
- Use explicit type definitions based on real API responses
- Bypass broken types with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` where necessary
- **Always verify against staging API, never trust client library types**

Example:
```typescript
// IMPORTANT: @redhat-cloud-services/host-inventory-client types are INCORRECT.
//
// Library types suggest: { results: [...], count, page, per_page, total }
// Real API returns: { meta: { count }, links: {...}, data: [...] }
//
// Always verify types against staging API, never trust the client library.
export interface InventoryGroupsResponse {
  data: InventoryGroup[];
  meta: {
    count: number;
  };
  links: {
    first: string;
    previous: string | null;
    next: string | null;
    last: string;
  };
}
```

---

## Critical Migration Rules

These rules were discovered through migration failures. **Violating them WILL break tests.**

### Rule 1: Preserve Original API Call Behavior EXACTLY

When migrating from Redux to React Query, the mutation must call the **exact same endpoints** as the original Redux helper. Don't assume the endpoint pattern - trace the original code.

**Example: Dynamic Base URL**

The original Redux helpers use `fetchEnvBaseUrl()` which fetches `/apps/rbac/env.json` to determine the base URL. In tests, this file doesn't exist, so the base URL becomes an empty string.

```typescript
// ❌ WRONG - hardcoded path breaks tests
const baseUrl = '/api/rbac/v1/admin';
return fetch(`${baseUrl}/change-users-status`, {...});

// ✅ CORRECT - matches original Redux helper behavior
const envUrl = await fetchEnvBaseUrl();  // Returns '' in tests
return fetch(`${envUrl}/change-users-status`, {...});  // Becomes '/change-users-status'
```

### Rule 2: Preserve Sort Parameter Handling

The original code extracts sort direction from the `-` prefix in `orderBy`:

```typescript
// ❌ WRONG - passes orderBy directly to API
orderBy: params.orderBy as ListPrincipalsParams['orderBy'],
sortOrder: params.sortOrder,

// ✅ CORRECT - extract sort direction from prefix
const sortOrder = params.orderBy?.startsWith('-') ? 'desc' : 'asc';
const orderByField = params.orderBy?.replace(/^-/, '');
// Then pass: orderBy: orderByField, sortOrder: sortOrder
```

### Rule 3: Accept All Original Type Variants

Different components may pass different types for the same parameter (e.g., `accountId` as `number | string | null`). The mutation must accept all original types:

```typescript
// ❌ WRONG - only accepts one type
config: {
  accountId: number | undefined;
}

// ✅ CORRECT - accepts all types used by different components
config: {
  accountId?: string | number | null;  // Some use org_id (number), others use internal.account_id (string)
}
```

### Rule 4: Never Change Data Sources

If a component uses `identity.org_id`, don't change it to `identity.internal.account_id`. Different data sources may have different values:

```typescript
// Original component A
setAccountId((await auth.getUser())?.identity.org_id as unknown as number);

// Original component B - DIFFERENT source!
setAccountId((await auth.getUser())?.identity?.internal?.account_id as string);

// ❌ WRONG - "standardizing" to one source
setAccountId(user?.identity?.internal?.account_id ?? null);  // Breaks component A!

// ✅ CORRECT - preserve the original source for each component
```

### Rule 5: Tests Must Pass WITHOUT Modification

If tests fail after migration:
1. The bug is in YOUR migration code, not the test
2. Trace what the original Redux code did
3. Make your React Query code behave identically
4. **Never modify tests to make them pass** - they validate correct behavior

### Rule 6: Check MSW Handler Paths

If you see MSW errors like:
```
[MSW] Error: intercepted a request without a matching request handler:
• PUT /api/rbac/v1/admin/change-users-status
```

This means your mutation is calling a different path than the original. The handlers were written to match the original behavior. **Fix your mutation, not the handlers.**

### Migration Checklist

Before considering a migration complete:

- [ ] All original Redux action imports removed from component
- [ ] React Query hook imports added
- [ ] Component uses `{ data, isLoading }` from query hook
- [ ] Mutations invalidate correct query keys
- [ ] **All existing tests pass without modification**
- [ ] Dynamic base URLs preserved (if applicable)
- [ ] Sort parameter handling preserved
- [ ] All original parameter types accepted

---

## Troubleshooting

### Query Not Refetching After Mutation

**Problem:** UI shows stale data after a mutation.

**Solution:** Ensure proper cache invalidation in the mutation's `onSuccess`:

```typescript
onSuccess: () => {
  // Invalidate ALL related queries
  queryClient.invalidateQueries({ queryKey: rolesKeys.all });
}
```

### Infinite Re-renders

**Problem:** Component re-renders infinitely.

**Cause:** Query params object is recreated on every render, changing the query key.

**Solution:** Use `useMemo` or pass `undefined` instead of empty object:

```typescript
// Bad - creates new object every render
useRolesQuery({});

// Good - stable reference
useRolesQuery(undefined);

// Good - memoized
const params = useMemo(() => ({ limit: 20 }), []);
useRolesQuery(params);
```

### 403 Spam in Console

**Problem:** Queries fire for unauthorized users.

**Solution:** Use conditional queries with `enabled`:

```typescript
const { data } = useRolesQuery(params, { enabled: isAdmin });

if (!isAdmin) {
  return <UnauthorizedAccess />;
}
```

### Type Errors with API Responses

**Problem:** TypeScript errors when accessing API response data.

**Cause:** Client library types don't match real API.

**Solution:**
1. Check staging API response
2. Define correct types in `src/data/api/`
3. Document discrepancy with comment
4. Use explicit type assertion if necessary

---

## Before vs. After

### Redux (Before) - ~200 lines
```typescript
// actions/roleActions.js
export const FETCH_ROLES = 'FETCH_ROLES';
export const FETCH_ROLES_SUCCESS = 'FETCH_ROLES_SUCCESS';
export const FETCH_ROLES_ERROR = 'FETCH_ROLES_ERROR';
export const fetchRoles = (params) => ({
  type: FETCH_ROLES,
  payload: rolesApi.listRoles(params),
  meta: { params }
});

// reducers/roleReducer.js
const initialState = { data: [], isLoading: false, error: null };
export default function rolesReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_ROLES: return { ...state, isLoading: true };
    case FETCH_ROLES_SUCCESS: return { ...state, data: action.payload, isLoading: false };
    case FETCH_ROLES_ERROR: return { ...state, error: action.payload, isLoading: false };
    default: return state;
  }
}

// selectors/roleSelectors.js
export const selectRoles = (state) => state.roles.data;
export const selectRolesLoading = (state) => state.roles.isLoading;

// Component
const roles = useSelector(selectRoles);
const isLoading = useSelector(selectRolesLoading);
const dispatch = useDispatch();
useEffect(() => {
  dispatch(fetchRoles({ limit: 20 }));
}, [dispatch]);
```

### TanStack Query (After) - ~30 lines
```typescript
// data/queries/roles.ts
export function useRolesQuery(params: ListRolesParams) {
  return useQuery({
    queryKey: rolesKeys.list(params),
    queryFn: async () => {
      const response = await rolesApi.listRoles(params);
      return response.data;
    },
  });
}

// Component
const { data, isLoading } = useRolesQuery({ limit: 20, offset: 0 });
```

**Result: 85% less code, 100% more reliable.**

---

## Additional Resources

- [TanStack Query Official Docs](https://tanstack.com/query/latest)
- [Query Keys Guide by TkDodo](https://tkdodo.eu/blog/effective-react-query-keys)
- [Mutation Best Practices by TkDodo](https://tkdodo.eu/blog/mastering-mutations-in-react-query)
- Internal Reference: `src/data/queries/roles.ts` (golden master pattern)

---

## Contributing

When adding new features or migrating Redux code:

1. Follow the established patterns in `src/data/`
2. Add Storybook stories with MSW handlers
3. Ensure type safety (no `any` types)
4. Document any client library type mismatches
5. Update this doc if you establish new patterns

For questions, see the internal team channel or reference existing implementations in the Roles slice.
