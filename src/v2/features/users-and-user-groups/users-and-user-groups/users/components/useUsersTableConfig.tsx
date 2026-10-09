import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import { type User, useAccountUsersPermissionsQuery } from '../../../../../../shared/data/queries/users';
import { SupportCasesToggle } from '../../../../../../shared/components/SupportCasesToggle';
import messages from '../../../../../../Messages';

/**
 * The master set of every column the users table can render. This is the single source
 * of truth: `columnConfig`/`cellRenderers` are keyed to it and therefore checked
 * exhaustively (miss a key and it won't compile). Visible columns are a runtime subset of
 * this set, so a rendered column can never lack a config/renderer entry.
 *
 * Add a column: add it here, then the compiler forces an entry in both maps below.
 */
export const allColumns = ['is_org_admin', 'manage_support_cases', 'username', 'email', 'first_name', 'last_name', 'is_active'] as const;

export type AllColumnId = (typeof allColumns)[number];

// Display orderings (subsets of allColumns). authModel moves the org-admin / support-cases
// columns to the front; `manage_support_cases` is filtered out at runtime when hidden.
const standardOrder = [
  'username',
  'email',
  'first_name',
  'last_name',
  'is_active',
  'is_org_admin',
  'manage_support_cases',
] as const satisfies readonly AllColumnId[];
const authModelOrder = [
  'is_org_admin',
  'manage_support_cases',
  'username',
  'email',
  'first_name',
  'last_name',
  'is_active',
] as const satisfies readonly AllColumnId[];

export const sortableColumns = ['username'] as const;

export type SortableColumnId = (typeof sortableColumns)[number];

interface UseUsersTableConfigOptions {
  intl: IntlShape;
  /** `platform.rbac.common-auth-model` flag — gates the support-cases column and column ordering */
  authModel: boolean;
  orgAdmin: boolean;
  isITLess: boolean;
  /** Current page of users — used to bulk-fetch support-cases permissions in one request. */
  users: User[];
  focusedUser?: User;
  ouiaId: string;
  onToggleUserStatus: (user: User, isActive: boolean) => void;
  onToggleOrgAdmin: (user: User, isOrgAdmin: boolean) => void;
}

interface UseUsersTableConfigReturn<TColumns extends readonly string[]> {
  columns: TColumns;
  columnConfig: ColumnConfigMap<TColumns>;
  cellRenderers: CellRendererMap<TColumns, User>;
  filterConfig: FilterConfig[];
}

export function useUsersTableConfig({
  intl,
  authModel,
  orgAdmin,
  isITLess,
  users,
  focusedUser,
  ouiaId,
  onToggleUserStatus,
  onToggleOrgAdmin,
}: UseUsersTableConfigOptions): UseUsersTableConfigReturn<readonly AllColumnId[]> {
  // Support-cases column requires the common-auth-model flag, an org admin, and a non-ITLess
  // environment (the account API is unavailable in ITLess/FedRAMP). Mirrors the V1 gate.
  const showSupportCases = authModel && orgAdmin && !isITLess;

  const columns = useMemo<readonly AllColumnId[]>(() => {
    const order = authModel ? authModelOrder : standardOrder;
    return showSupportCases ? order : order.filter((column) => column !== 'manage_support_cases');
  }, [authModel, showSupportCases]);

  // Bulk-fetch support-cases permissions for every row in one request (avoids a per-row N+1).
  const supportCasesUserIds = useMemo(
    () => (showSupportCases ? users.map((u) => (u.external_source_id != null ? String(u.external_source_id) : undefined)) : []),
    [showSupportCases, users],
  );
  const { isLoading: isSupportCasesLoading, isError: isSupportCasesError } = useAccountUsersPermissionsQuery(supportCasesUserIds, {
    enabled: showSupportCases,
  });

  // Keyed to the full master set — exhaustiveness is enforced here once. The visible `columns`
  // above are always a subset, so every rendered column is guaranteed a config entry.
  const columnConfig: ColumnConfigMap<typeof allColumns> = useMemo(
    () => ({
      username: { label: intl.formatMessage(messages.username), sortable: true },
      email: { label: intl.formatMessage(messages.email) },
      first_name: { label: intl.formatMessage(messages.firstName) },
      last_name: { label: intl.formatMessage(messages.lastName) },
      is_active: { label: intl.formatMessage(messages.status) },
      is_org_admin: { label: intl.formatMessage(messages.orgAdmin) },
      manage_support_cases: { label: intl.formatMessage(messages.manageSupportCases) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof allColumns, User> = useMemo(
    () => ({
      username: (user) => (focusedUser?.username === user.username ? <strong>{user.username}</strong> : user.username),
      email: (user) => user.email,
      first_name: (user) => user.first_name,
      last_name: (user) => user.last_name,
      is_active: (user) => (
        <span onClick={(e) => e.stopPropagation()} role="presentation">
          <Switch
            id={`${user.username}-status-switch`}
            aria-label={`Toggle status for ${user.username}`}
            isChecked={user.is_active || false}
            isDisabled={!user.is_active && !orgAdmin}
            onChange={(_, checked) => onToggleUserStatus(user, checked)}
            ouiaId={`${ouiaId}-${user.username}-status-switch`}
          />
        </span>
      ),
      is_org_admin: (user) => (
        <span onClick={(e) => e.stopPropagation()} role="presentation">
          <Switch
            id={`${user.username}-org-admin-switch`}
            aria-label={`Toggle org admin for ${user.username}`}
            isChecked={user.is_org_admin || false}
            isDisabled={!orgAdmin || !user.is_active}
            onChange={(_, checked) => onToggleOrgAdmin(user, checked)}
            ouiaId={`${ouiaId}-${user.username}-org-admin-switch`}
          />
        </span>
      ),
      manage_support_cases: (user) => {
        const userId = user.external_source_id != null ? String(user.external_source_id) : undefined;
        return (
          <span onClick={(e) => e.stopPropagation()} role="presentation">
            <SupportCasesToggle
              userId={userId}
              username={user.username}
              isDisabled={!orgAdmin}
              isActive={user.is_active ?? true}
              isPermissionsLoading={isSupportCasesLoading}
              isPermissionsError={isSupportCasesError}
            />
          </span>
        );
      },
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin, isSupportCasesLoading, isSupportCasesError],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'username',
        label: intl.formatMessage(messages.username),
        placeholder: intl.formatMessage(messages.filterByUsername),
      },
      {
        type: 'text',
        id: 'email',
        label: intl.formatMessage(messages.email),
        placeholder: intl.formatMessage(messages.filterByUsername),
      },
    ],
    [intl],
  );

  return {
    columns,
    columnConfig,
    cellRenderers,
    filterConfig,
  };
}
