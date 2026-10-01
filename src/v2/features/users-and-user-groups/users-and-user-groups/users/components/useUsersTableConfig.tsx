import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import type { User } from '../../../../../../shared/data/queries/users';
import { SupportCasesToggle } from '../../../../../../shared/components/SupportCasesToggle';
import messages from '../../../../../../Messages';

export const standardColumns = ['username', 'email', 'first_name', 'last_name', 'is_active', 'is_org_admin'] as const;
export const standardColumnsWithSupportCases = [
  'username',
  'email',
  'first_name',
  'last_name',
  'is_active',
  'is_org_admin',
  'manage_support_cases',
] as const;

// Auth model columns (authModel=true): org admin column moves first
export const authModelColumns = ['is_org_admin', 'username', 'email', 'first_name', 'last_name', 'is_active'] as const;
export const authModelColumnsWithSupportCases = [
  'is_org_admin',
  'manage_support_cases',
  'username',
  'email',
  'first_name',
  'last_name',
  'is_active',
] as const;

export const sortableColumns = ['username'] as const;

export type StandardColumnId = (typeof standardColumns)[number];
export type AuthModelColumnId = (typeof authModelColumns)[number];
export type SortableColumnId = (typeof sortableColumns)[number];

type AllColumnIds = StandardColumnId | AuthModelColumnId | 'manage_support_cases';
type AnyColumns = readonly AllColumnIds[];

interface UseUsersTableConfigOptions {
  intl: IntlShape;
  authModel: boolean;
  orgAdmin: boolean;
  isITLess: boolean;
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
  focusedUser,
  ouiaId,
  onToggleUserStatus,
  onToggleOrgAdmin,
}: UseUsersTableConfigOptions): UseUsersTableConfigReturn<AnyColumns> {
  // Show support cases column only for non-ITLess org admins
  const showSupportCases = orgAdmin && !isITLess;

  const columns = useMemo(() => {
    if (authModel) {
      return showSupportCases ? authModelColumnsWithSupportCases : authModelColumns;
    }
    return showSupportCases ? standardColumnsWithSupportCases : standardColumns;
  }, [authModel, showSupportCases]);

  const allColumnConfig: ColumnConfigMap<AnyColumns> = useMemo(
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

  const allCellRenderers: CellRendererMap<AnyColumns, User> = useMemo(
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
            <SupportCasesToggle userId={userId} username={user.username} isDisabled={!orgAdmin} isActive={user.is_active ?? true} />
          </span>
        );
      },
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
        placeholder: intl.formatMessage(messages.filterByUsername),
      },
    ],
    [intl],
  );

  return {
    columns,
    columnConfig: allColumnConfig,
    cellRenderers: allCellRenderers,
    filterConfig,
  };
}
