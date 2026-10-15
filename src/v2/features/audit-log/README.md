# Audit Log

Read-only table of RBAC audit log entries showing actions performed against roles, groups, and users.

## Route

| Path | Component |
|---|---|
| `/access-management/audit-log` | `AuditLog` |

## Files

| File | Purpose |
|---|---|
| `AuditLog.tsx` | Page component — fetches data via `useAuditLogsQuery`, renders `TableView` with server-side filtering and pagination |
| `AuditLogTable.tsx` | Presentational table component — receives entries as props, handles client-side filtering (legacy, not used by page) |
| `AuditLogTable.stories.tsx` | Storybook stories for `AuditLogTable` covering default, loading, empty, error, and pagination states |
| User journey `AuditLog.stories.tsx` | Journey stories for the full page: table view, sidebar nav, pagination, filtering |

## Data Layer

- **API client**: `src/v2/data/api/audit.ts` — wraps `@redhat-cloud-services/rbac-client` `getAuditlogs` endpoint (RBAC v1)
- **Query hook**: `src/v2/data/queries/audit.ts` — `useAuditLogsQuery` (TanStack Query)
- **MSW handlers**: `src/v2/data/mocks/audit.handlers.ts` — `auditHandlers()`, `auditErrorHandlers()`, `auditLoadingHandlers()`
- **Fixtures**: `src/v2/data/mocks/audit.fixtures.ts` — `defaultAuditLogs`

## Columns

Date · Requester · Description · Resource · Action

## Filters

All filters are server-side (sent as API query params, not client-side filtering).

| Filter | Type | API Param | Values |
|---|---|---|---|
| Requester | Text search | `principal_username` (partial match) | Free text |
| Resource | Checkbox | `resource_type` | `group`, `role`, `user` |
| Action | Checkbox | `action` | `add`, `create`, `delete`, `edit`, `remove` |

## Permissions

No special permissions beyond standard RBAC access. The API enforces org-admin visibility. Route is guarded by `guardOrgAdmin()`.
