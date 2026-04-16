# Error Handling Guidelines

Patterns for handling errors, loading states, and permission failures in the RBAC UI.

## API error handling

### React Query mutations

- Mutation hooks in `src/*/data/queries/` use `useAppServices().notify` for user-facing error messages.
- Notification uses `@redhat-cloud-services/frontend-components-notifications` (PatternFly-based toasts).
- In data layer hooks, import `notify` from `useAppServices()` — never import `useAddNotification` directly (ESLint-enforced in `src/**/data/queries/**/*.ts`).

### Error notification pattern

```typescript
const { notify } = useAppServices();

// In mutation onError:
onError: (error) => {
  notify({
    variant: 'danger',
    title: intl.formatMessage(messages.deleteError),
    description: error?.message,
  });
}
```

### API error context

- `ApiErrorProvider` (`src/shared/contexts/ApiErrorContext`) wraps the app and provides centralized error state.
- Components can access global API error state through this context.

## Permission denied handling

### V1
- `guard()` and `guardOrgAdmin()` from `src/v1/components/PermissionGuard.tsx` wrap route layouts. If the user lacks permissions, the guard renders a "not authorized" view instead of the page content.
- `useAccessPermissions` returns `{ hasAccess, isLoading }` — components check `isLoading` before rendering.

### V2
- `v2Guard()` and `v2GuardOrgAdmin()` from `src/v2/components/V2PermissionGuard.tsx` use Kessel domain hooks.
- `V2WorkspacePermissionGuard` (`src/v2/components/V2WorkspacePermissionGuard.tsx`) guards workspace-scoped actions.
- `V2RoleBindingPermissionGuard` (`src/v2/components/V2RoleBindingPermissionGuard.tsx`) guards role-binding actions.
- All guards render permission-denied states when access is denied.

## Loading states

- React Query hooks return `isLoading` / `isPending` — use these for loading indicators.
- Kessel permission hooks return `isLoading` — do not render permission-dependent UI until loading completes.
- `useIdentity` returns `{ ready: boolean }` — do not render the app shell until `ready` is `true`.

## Error states in Storybook

- Test error scenarios via handler factories: `groupsErrorHandlers(500)`, `v2RolesErrorHandlers(403)`.
- `onUnhandledRequest: 'error'` in MSW initialization catches unexpected API calls — this surfaces handler gaps during development.

## Form validation

- Forms use `@data-driven-forms/react-form-renderer` with `pf4-component-mapper`.
- Validation is declarative in form schemas — validators return error messages that the form renderer displays inline.
- Type-safe form submission: see `src/docs/TypeSafeFormSubmission.mdx`.

## Auth error handling

- `useIdentity` catches `getUser()` failures and falls back to `{ ready: true, orgAdmin: false }` — the app does not crash on auth failures but operates in a degraded state.
- Token retrieval (`getToken()`) returns `''` if the token is null — downstream API calls will fail with 401, which React Query handles.

## Console error discipline

- `no-console` ESLint rule is enforced in story and test files (allows `console.error` only).
- `failOnConsole` in Storybook catches unexpected console errors during interaction tests — keep play functions clean.
