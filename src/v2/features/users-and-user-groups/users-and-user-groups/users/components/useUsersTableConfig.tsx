import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import type { User } from '../../../../../../shared/data/queries/users';
import { commonMessages } from '../../../../../../shared/messages/common';

export const standardColumns = ['username', 'email', 'first_name', 'last_name', 'is_active', 'is_org_admin'] as const;

// Auth model columns (authModel=true): org admin column moves first
export const authModelColumns = ['is_org_admin', 'username', 'email', 'first_name', 'last_name', 'is_active'] as const;

export const sortableColumns = ['username'] as const;

export type StandardColumnId = (typeof standardColumns)[number];
export type AuthModelColumnId = (typeof authModelColumns)[number];
export type SortableColumnId = (typeof sortableColumns)[number];

interface UseUsersTableConfigOptions {
  intl: IntlShape;
  authModel: boolean;
  orgAdmin: boolean;
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
  focusedUser,
  ouiaId,
  onToggleUserStatus,
  onToggleOrgAdmin,
}: UseUsersTableConfigOptions): UseUsersTableConfigReturn<typeof standardColumns> | UseUsersTableConfigReturn<typeof authModelColumns> {
  const standardColumnConfig: ColumnConfigMap<typeof standardColumns> = useMemo(
    () => ({
      username: { label: intl.formatMessage(commonMessages.username), sortable: true },
      email: { label: intl.formatMessage(commonMessages.email) },
      first_name: { label: intl.formatMessage(commonMessages.firstName) },
      last_name: { label: intl.formatMessage(commonMessages.lastName) },
      is_active: { label: intl.formatMessage(commonMessages.status) },
      is_org_admin: { label: intl.formatMessage({ id: 'orgAdmin', defaultMessage: 'Org. Admin', description: 'Org. Admin name' }) },
    }),
    [intl],
  );

  const authModelColumnConfig: ColumnConfigMap<typeof authModelColumns> = useMemo(
    () => ({
      is_org_admin: { label: intl.formatMessage({ id: 'orgAdmin', defaultMessage: 'Org. Admin', description: 'Org. Admin name' }) },
      username: { label: intl.formatMessage(commonMessages.username), sortable: true },
      email: { label: intl.formatMessage(commonMessages.email) },
      first_name: { label: intl.formatMessage(commonMessages.firstName) },
      last_name: { label: intl.formatMessage(commonMessages.lastName) },
      is_active: { label: intl.formatMessage(commonMessages.status) },
    }),
    [intl],
  );

  // Cell renderers use username as unique identifier (API's natural key)
  const standardCellRenderers: CellRendererMap<typeof standardColumns, User> = useMemo(
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
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin],
  );

  const authModelCellRenderers: CellRendererMap<typeof authModelColumns, User> = useMemo(
    () => ({
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
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'username',
        label: intl.formatMessage(commonMessages.username),
        placeholder: intl.formatMessage({ id: 'filterByUsername', defaultMessage: 'Filter by username', description: 'Filter by username label' }),
      },
      {
        type: 'text',
        id: 'email',
        label: intl.formatMessage(commonMessages.email),
        placeholder: intl.formatMessage({ id: 'filterByUsername', defaultMessage: 'Filter by username', description: 'Filter by username label' }), // Same placeholder as original
      },
    ],
    [intl],
  );

  if (authModel) {
    return {
      columns: authModelColumns,
      columnConfig: authModelColumnConfig,
      cellRenderers: authModelCellRenderers,
      filterConfig,
    };
  }

  return {
    columns: standardColumns,
    columnConfig: standardColumnConfig,
    cellRenderers: standardCellRenderers,
    filterConfig,
  };
}
