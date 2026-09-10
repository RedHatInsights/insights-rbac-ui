import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import type { User } from '../../../../../../shared/data/queries/users';
import messages from '../../../../../../Messages';

export const standardColumns = ['username', 'email', 'first_name', 'last_name', 'is_active', 'is_org_admin'] as const;

// Extended with Manage Support Cases (hidden in ITLess)
export const standardColumnsWithCases = ['username', 'email', 'first_name', 'last_name', 'is_active', 'is_org_admin', 'portal_manage_cases'] as const;

// Auth model columns (authModel=true): org admin column moves first
export const authModelColumns = ['is_org_admin', 'username', 'email', 'first_name', 'last_name', 'is_active'] as const;

// Extended with Manage Support Cases (hidden in ITLess)
export const authModelColumnsWithCases = [
  'is_org_admin',
  'portal_manage_cases',
  'username',
  'email',
  'first_name',
  'last_name',
  'is_active',
] as const;

export const sortableColumns = ['username'] as const;

export type StandardColumnId = (typeof standardColumns)[number];
export type StandardWithCasesColumnId = (typeof standardColumnsWithCases)[number];
export type AuthModelColumnId = (typeof authModelColumns)[number];
export type AuthModelWithCasesColumnId = (typeof authModelColumnsWithCases)[number];
export type SortableColumnId = (typeof sortableColumns)[number];

interface UseUsersTableConfigOptions {
  intl: IntlShape;
  authModel: boolean;
  orgAdmin: boolean;
  isITLess: boolean;
  focusedUser?: User;
  ouiaId: string;
  onToggleUserStatus: (user: User, isActive: boolean) => void;
  onToggleOrgAdmin: (user: User, isOrgAdmin: boolean) => void;
  onToggleManageCases: (user: User, enabled: boolean) => void;
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
  focusedUser,
  ouiaId,
  onToggleUserStatus,
  onToggleOrgAdmin,
  onToggleManageCases,
}: UseUsersTableConfigOptions):
  | UseUsersTableConfigReturn<typeof standardColumns>
  | UseUsersTableConfigReturn<typeof standardColumnsWithCases>
  | UseUsersTableConfigReturn<typeof authModelColumns>
  | UseUsersTableConfigReturn<typeof authModelColumnsWithCases> {
  const showManageCases = !isITLess;

  // Shared cell renderers — reused across all column variants
  const renderUsername = (user: User) => (focusedUser?.username === user.username ? <strong>{user.username}</strong> : user.username);
  const renderEmail = (user: User) => user.email;
  const renderFirstName = (user: User) => user.first_name;
  const renderLastName = (user: User) => user.last_name;
  const renderStatus = (user: User) => (
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
  );
  const renderOrgAdmin = (user: User) => (
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
  );
  const renderManageCases = (user: User) => (
    <span onClick={(e) => e.stopPropagation()} role="presentation">
      <Switch
        id={`${user.username}-manage-cases-switch`}
        aria-label={`Toggle manage support cases for ${user.username}`}
        isChecked={user.portal_manage_cases || false}
        isDisabled={!orgAdmin || !user.is_active}
        onChange={(_, checked) => onToggleManageCases(user, checked)}
        ouiaId={`${ouiaId}-${user.username}-manage-cases-switch`}
      />
    </span>
  );

  // Shared column config entries
  const manageCasesColumnConfig = { label: intl.formatMessage(messages.manageSupportCases) };
  const baseColumnConfigs = {
    username: { label: intl.formatMessage(messages.username), sortable: true },
    email: { label: intl.formatMessage(messages.email) },
    first_name: { label: intl.formatMessage(messages.firstName) },
    last_name: { label: intl.formatMessage(messages.lastName) },
    is_active: { label: intl.formatMessage(messages.status) },
    is_org_admin: { label: intl.formatMessage(messages.orgAdmin) },
  };

  // Cell renderers use username as unique identifier (API's natural key)
  const standardCellRenderers: CellRendererMap<typeof standardColumns, User> = useMemo(
    () => ({
      username: renderUsername,
      email: renderEmail,
      first_name: renderFirstName,
      last_name: renderLastName,
      is_active: renderStatus,
      is_org_admin: renderOrgAdmin,
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin],
  );

  const standardWithCasesCellRenderers: CellRendererMap<typeof standardColumnsWithCases, User> = useMemo(
    () => ({
      username: renderUsername,
      email: renderEmail,
      first_name: renderFirstName,
      last_name: renderLastName,
      is_active: renderStatus,
      is_org_admin: renderOrgAdmin,
      portal_manage_cases: renderManageCases,
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin, onToggleManageCases],
  );

  const authModelCellRenderers: CellRendererMap<typeof authModelColumns, User> = useMemo(
    () => ({
      is_org_admin: renderOrgAdmin,
      username: renderUsername,
      email: renderEmail,
      first_name: renderFirstName,
      last_name: renderLastName,
      is_active: renderStatus,
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin],
  );

  const authModelWithCasesCellRenderers: CellRendererMap<typeof authModelColumnsWithCases, User> = useMemo(
    () => ({
      is_org_admin: renderOrgAdmin,
      portal_manage_cases: renderManageCases,
      username: renderUsername,
      email: renderEmail,
      first_name: renderFirstName,
      last_name: renderLastName,
      is_active: renderStatus,
    }),
    [focusedUser, orgAdmin, ouiaId, onToggleUserStatus, onToggleOrgAdmin, onToggleManageCases],
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

  if (authModel && showManageCases) {
    return {
      columns: authModelColumnsWithCases,
      columnConfig: { ...baseColumnConfigs, portal_manage_cases: manageCasesColumnConfig } as ColumnConfigMap<typeof authModelColumnsWithCases>,
      cellRenderers: authModelWithCasesCellRenderers,
      filterConfig,
    };
  }

  if (authModel) {
    return {
      columns: authModelColumns,
      columnConfig: baseColumnConfigs as ColumnConfigMap<typeof authModelColumns>,
      cellRenderers: authModelCellRenderers,
      filterConfig,
    };
  }

  if (showManageCases) {
    return {
      columns: standardColumnsWithCases,
      columnConfig: { ...baseColumnConfigs, portal_manage_cases: manageCasesColumnConfig } as ColumnConfigMap<typeof standardColumnsWithCases>,
      cellRenderers: standardWithCasesCellRenderers,
      filterConfig,
    };
  }

  return {
    columns: standardColumns,
    columnConfig: baseColumnConfigs as ColumnConfigMap<typeof standardColumns>,
    cellRenderers: standardCellRenderers,
    filterConfig,
  };
}
