# Audit Log

Shared, read-only table of RBAC audit log entries showing actions performed against roles, groups, and users. Both User Access (V1) and Access Management (V2) use the same page and RBAC v1 API.

## Route

| Path | Component |
|---|---|
| `/user-access/audit-log` | `AuditLog` (V1) |
| `/access-management/audit-log` | `AuditLog` (V2) |

## Files

| File | Purpose |
|---|---|
| `AuditLog.tsx` | Page component — fetches data via `useAuditLogsQuery`, renders `TableView` with server-side filtering and pagination |
| `AuditLogTable.tsx` | Presentational table component — receives entries as props, handles client-side filtering (legacy, not used by page) |
| `AuditLogTable.stories.tsx` | Storybook stories for `AuditLogTable` covering default, loading, empty, error, and pagination states |
| User journey `AuditLog.stories.tsx` | Journey stories for the full page: table view, sidebar nav, pagination, filtering |

## Data Layer

- **API client**: `src/shared/data/api/audit.ts` — wraps `@redhat-cloud-services/rbac-client` `getAuditlogs` endpoint (`GET /api/rbac/v1/auditlogs/`)
- **Query hook**: `src/shared/data/queries/audit.ts` — `useAuditLogsQuery` (TanStack Query)
- **MSW handlers**: `src/shared/data/mocks/audit.handlers.ts` — `auditHandlers()`, `auditErrorHandlers()`, `auditLoadingHandlers()`
- **Fixtures**: `src/shared/data/mocks/audit.fixtures.ts` — `defaultAuditLogs`

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

The page and its navigation item are org-admin-only in both versions. V1 route uses `guardOrgAdmin()`; V2 route uses `v2GuardOrgAdmin()`. The API also enforces org-admin visibility.
