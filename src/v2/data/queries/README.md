# V2 Data Layer — React Query Hooks

V2-specific query/mutation hooks for Access Management features. These hooks are also consumed by the CLI, so they **must be environment-agnostic**.

## DI Contract

All dependencies come from `useAppServices()` (ServiceContext). Never import platform-specific hooks or packages directly.

```typescript
import { useAppServices } from '../../../shared/contexts/ServiceContext';
import { createRolesV2Api } from '../api/roles';

export function useExampleQuery(params, options?) {
  const { axios } = useAppServices();
  const api = createRolesV2Api(axios);

  return useQuery({
    queryKey: exampleKeys.list(params),
    queryFn: () => api.rolesList(params).then(r => r.data),
  });
}

export function useExampleMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const api = createRolesV2Api(axios);
  const intl = useIntl();
  const qc = useMutationQueryClient(options?.queryClient);

  return useMutation({
    mutationFn: (data) => api.rolesCreate({ rolesCreateOrUpdateRoleRequest: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rolesV2Keys.all });
      notify('success', intl.formatMessage(messages.successTitle));
    },
    onError: () => {
      notify('danger', intl.formatMessage(messages.errorTitle));
    },
  });
}
```

## Banned Imports (ESLint-enforced)

- `@redhat-cloud-services/frontend-components-notifications/*` → use `notify` from `useAppServices()`
- `@redhat-cloud-services/frontend-components/useChrome` → use `useAppServices()` fields
- `@unleash/proxy-client-react` → use `isITLess` from `useAppServices()`
- `**/hooks/usePlatformAuth` → use `getToken` from `useAppServices()`
- `**/hooks/usePlatformEnvironment` → use `environment` / `ssoUrl` from `useAppServices()`
- `**/hooks/useIdentity` → use `identity` from `useAppServices()`

## Files

| File | Domain | APIs |
|------|--------|------|
| `roles.ts` | V2 roles CRUD, role bindings, role assignments | RBAC V2 roles |
| `workspaces.ts` | Workspaces CRUD, role bindings, access grants | RBAC V2 workspaces |
| `groups.ts` | V2 groups (wraps shared groups with V2 conventions) | RBAC V1 groups |
| `audit.ts` | Audit logs | RBAC V2 audit |
| `groupAssignments.ts` | Composed view of group role assignments | Composes `roles.ts` + `workspaces.ts` |

See [src/docs/DataLayerDI.mdx](../../../docs/DataLayerDI.mdx) for the full pattern documentation.
