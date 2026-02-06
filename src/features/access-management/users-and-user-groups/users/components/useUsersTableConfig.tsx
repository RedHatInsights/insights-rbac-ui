import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../components/table-view';
import type { User } from '../../../../../data/queries/users';
import messages from '../../../../../Messages';

// Standard columns (authModel=false): username, email, first_name, last_name, is_active, user_groups_count, is_org_admin
export const standardColumns = ['username', 'email', 'first_name', 'last_name', 'is_active', 'user_groups_count', 'is_org_admin'] as const;

// Auth model columns (authModel=true): is_org_admin, username, email, first_name, last_name, is_active, user_groups_count
export const authModelColumns = ['is_org_admin', 'username', 'email', 'first_name', 'last_name', 'is_active', 'user_groups_count'] as const;

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
      username: { label: intl.formatMessage(messages.username), sortable: true },
      email: { label: intl.formatMessage(messages.email) },
      first_name: { label: intl.formatMessage(messages.firstName) },
      last_name: { label: intl.formatMessage(messages.lastName) },
      is_active: { label: intl.formatMessage(messages.status) },
      user_groups_count: { label: intl.formatMessage(messages.userGroups) },
      is_org_admin: { label: intl.formatMessage(messages.orgAdmin) },
    }),
    [intl],
  );

  const authModelColumnConfig: ColumnConfigMap<typeof authModelColumns> = useMemo(
    () => ({
      is_org_admin: { label: intl.formatMessage(messages.orgAdmin) },
      username: { label: intl.formatMessage(messages.username), sortable: true },
      email: { label: intl.formatMessage(messages.email) },
      first_name: { label: intl.formatMessage(messages.firstName) },
      last_name: { label: intl.formatMessage(messages.lastName) },
      is_active: { label: intl.formatMessage(messages.status) },
      user_groups_count: { label: intl.formatMessage(messages.userGroups) },
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
        <Switch
          id={`${user.username}-status-switch`}
          aria-label={`Toggle status for ${user.username}`}
          isChecked={user.is_active || false}
          isDisabled={!user.is_active && !orgAdmin}
          onChange={(_, checked) => onToggleUserStatus(user, checked)}
          ouiaId={`${ouiaId}-${user.username}-status-switch`}
        />
      ),
      user_groups_count: (user) => (user.user_groups_count as number) ?? 0,
      is_org_admin: (user) => (
        <Switch
          id={`${user.username}-org-admin-switch`}
          aria-label={`Toggle org admin for ${user.username}`}
          isChecked={user.is_org_admin || false}
          isDisabled={!orgAdmin || !user.is_active}
          onChange={(_, checked) => onToggleOrgAdmin(user, checked)}
          ouiaId={`${ouiaId}-${user.username}-org-admin-switch`}
        />
      ),
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin],
  );

  const authModelCellRenderers: CellRendererMap<typeof authModelColumns, User> = useMemo(
    () => ({
      is_org_admin: (user) => (
        <Switch
          id={`${user.username}-org-admin-switch`}
          aria-label={`Toggle org admin for ${user.username}`}
          isChecked={user.is_org_admin || false}
          isDisabled={!orgAdmin || !user.is_active}
          onChange={(_, checked) => onToggleOrgAdmin(user, checked)}
          ouiaId={`${ouiaId}-${user.username}-org-admin-switch`}
        />
      ),
      username: (user) => (focusedUser?.username === user.username ? <strong>{user.username}</strong> : user.username),
      email: (user) => user.email,
      first_name: (user) => user.first_name,
      last_name: (user) => user.last_name,
      is_active: (user) => (
        <Switch
          id={`${user.username}-status-switch`}
          aria-label={`Toggle status for ${user.username}`}
          isChecked={user.is_active || false}
          isDisabled={!user.is_active && !orgAdmin}
          onChange={(_, checked) => onToggleUserStatus(user, checked)}
          ouiaId={`${ouiaId}-${user.username}-status-switch`}
        />
      ),
      user_groups_count: (user) => (user.user_groups_count as number) ?? 0,
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin],
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
        placeholder: intl.formatMessage(messages.filterByUsername), // Same placeholder as original
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
