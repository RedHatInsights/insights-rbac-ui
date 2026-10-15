# V1 Data Layer — React Query Hooks

V1-specific query/mutation hooks for User Access features. These hooks are also consumed by the CLI, so they **must be environment-agnostic**.

## DI Contract

All dependencies come from `useAppServices()` (ServiceContext). Never import platform-specific hooks or packages directly.

```typescript
import { useAppServices } from '../../../shared/contexts/ServiceContext';

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
      notify('success', intl.formatMessage(messages.successTitle));
    },
    onError: () => {
      notify('danger', intl.formatMessage(messages.errorTitle));
    },
  }, options?.queryClient);
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
| `roles.ts` | Roles CRUD | RBAC V1 roles |
| `access.ts` | Principal access (permission checks) | RBAC V1 access |

See [src/docs/DataLayerDI.mdx](../../../docs/DataLayerDI.mdx) for the full pattern documentation.
