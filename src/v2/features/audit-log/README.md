# Audit Log

Read-only table of RBAC audit log entries showing actions performed against roles, groups, and users.

## Route

| Path | Component |
|---|---|
| `/user-access/audit-log` | `AuditLog` |

## Files

| File | Purpose |
|---|---|
| `AuditLog.tsx` | Page component — fetches data via `useAuditLogsQuery` and renders `TableView` |
| `AuditLogTable.tsx` | Presentational table component — receives entries as props, handles client-side filtering and pagination |
| `AuditLogTable.stories.tsx` | Storybook stories covering default, loading, empty, error, and pagination states |

## Data Layer

- **API client**: `src/data/api/audit.ts` — wraps `@redhat-cloud-services/rbac-client` `getAuditlogs` endpoint (RBAC v1)
- **Query hook**: `src/data/queries/audit.ts` — `useAuditLogsQuery` (TanStack Query)

## Columns

Date · Requester · Description · Resource · Action

## Permissions

No special permissions beyond standard RBAC access. The API enforces org-admin visibility.
