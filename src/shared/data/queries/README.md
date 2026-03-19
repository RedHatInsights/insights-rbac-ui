# Shared Data Layer — React Query Hooks

Shared query/mutation hooks used by both V1 and V2 features. These hooks are also consumed by the CLI, so they **must be environment-agnostic**.

## DI Contract

All dependencies come from `useAppServices()` (ServiceContext). Never import platform-specific hooks or packages directly.

```typescript
import { useAppServices } from '../../contexts/ServiceContext';

export function useExampleQuery(params, options?: QueryOptions) {
  const { axios } = useAppServices();
  const api = createExampleApi(axios);

  return useQuery({
    queryKey: exampleKeys.list(params),
    queryFn: () => api.list(params).then(r => r.data),
  }, options?.queryClient);
}

export function useExampleMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const api = createExampleApi(axios);
  const intl = useIntl();
  const qc = useMutationQueryClient(options?.queryClient);

  return useMutation({
    mutationFn: (data) => api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: exampleKeys.all });
      notify('success', intl.formatMessage(messages.exampleSuccessTitle));
    },
    onError: () => {
      notify('danger', intl.formatMessage(messages.exampleErrorTitle));
    },
  }, options?.queryClient);
}
```

For hooks that need auth tokens, environment, or identity for external API calls:

```typescript
export function useExternalApiMutation(options?: MutationOptions) {
  const { axios, notify, getToken, environment, identity, isITLess } = useAppServices();
  // Use these DI'd values — never import usePlatformAuth, useIdentity, etc.
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
| `groups.ts` | Groups CRUD, members, roles, service accounts | RBAC V1 groups |
| `users.ts` | Users list, status change, org admin, invite | RBAC V1 principals + external IT API |
| `permissions.ts` | Permission options and lists | RBAC V1 permissions |
| `inventory.ts` | Inventory groups for resource definitions | Host Inventory API |
| `cost.ts` | Resource types for cost management permissions | Cost Management API |
| `serviceAccounts.ts` | Service accounts list | External SSO API |

See [src/docs/DataLayerDI.mdx](../../docs/DataLayerDI.mdx) for the full pattern documentation.
