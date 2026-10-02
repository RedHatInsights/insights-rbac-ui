/**
 * useGroupsTableConfig Hook
 *
 * Extracts table configuration (columns, renderers, filters, expansion)
 * from the Groups component into a reusable hook.
 */

import React, { useCallback, useMemo } from 'react';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { type IntlShape, defineMessages } from 'react-intl';

import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import { AppLink } from '../../../shared/components/navigation/AppLink';
import { DefaultInfoPopover } from './components/DefaultInfoPopover';
import { GroupsRolesTable } from './components/GroupsRolesTable';
import { GroupsMembersTable } from './components/GroupsMembersTable';
import { getDateFormat } from '../../../shared/helpers/stringUtilities';

import pathnames from '../../utilities/pathnames';
import type { Group } from './types';
import { commonMessages } from '../../../shared/messages/common';

const messages = defineMessages({
  orgAdminInheritedRoles: {
    id: 'orgAdminInheritedRoles',
    defaultMessage:
      'This group contains the roles that all org admin users inherit by default. The roles within this group are managed and maintained by Red Hat and cannot be edited.',
    description: 'Org. Admin inherited roles message',
  },
  usersInheritedRoles: {
    id: 'usersInheritedRoles',
    defaultMessage: 'This group contains the roles that all users in your organization inherit by default.',
    description: 'Users inherited roles message',
  },
});

// =============================================================================
// Column Definitions (exported for use in Groups component)
// =============================================================================

export const columns = ['name', 'roles', 'members', 'modified'] as const;
export const sortableColumns = ['name', 'modified'] as const;
export const compoundColumns = ['roles', 'members'] as const;

export type SortableColumnId = (typeof sortableColumns)[number];
export type CompoundColumnId = (typeof compoundColumns)[number];

// =============================================================================
// Hook
// =============================================================================

interface UseGroupsTableConfigOptions {
  intl: IntlShape;
}

interface UseGroupsTableConfigReturn {
  columnConfig: ColumnConfigMap<typeof columns>;
  cellRenderers: CellRendererMap<typeof columns, Group>;
  expansionRenderers: ExpansionRendererMap<CompoundColumnId, Group>;
  filterConfig: FilterConfig[];
  isCellExpandable: (group: Group, column: CompoundColumnId) => boolean;
}

export function useGroupsTableConfig({ intl }: UseGroupsTableConfigOptions): UseGroupsTableConfigReturn {
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(commonMessages.name), sortable: true },
      roles: { label: intl.formatMessage(commonMessages.roles), isCompound: true },
      members: { label: intl.formatMessage(commonMessages.members), isCompound: true },
      modified: {
        label: intl.formatMessage(commonMessages.lastModified),
        sortable: true,
      },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, Group> = useMemo(
    () => ({
      name: (group) => (
        <>
          <AppLink to={pathnames['group-detail-roles'].link(group.uuid)}>{group.name}</AppLink>
          {(group.platform_default || group.admin_default) && (
            <DefaultInfoPopover
              id={`default${group.admin_default ? '-admin' : ''}-group-popover`}
              uuid={group.uuid}
              bodyContent={intl.formatMessage(group.admin_default ? messages.orgAdminInheritedRoles : messages.usersInheritedRoles)}
            />
          )}
        </>
      ),
      roles: (group) => group.roleCount ?? 0,
      members: (group) => group.principalCount ?? 0,
      modified: (group) => (group.modified ? <DateFormat date={group.modified} type={getDateFormat(group.modified)} /> : '—'),
    }),
    [intl],
  );

  const expansionRenderers: ExpansionRendererMap<CompoundColumnId, Group> = useMemo(
    () => ({
      roles: (group) => <GroupsRolesTable group={group} />,
      members: (group) => <GroupsMembersTable group={group} />,
    }),
    [],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'name',
        label: intl.formatMessage(commonMessages.name),
        placeholder: `Filter by ${intl.formatMessage(commonMessages.name).toLowerCase()}`,
      },
    ],
    [intl],
  );

  const isCellExpandable = useCallback((group: Group, column: CompoundColumnId): boolean => {
    if (column === 'members') {
      return !group.platform_default && !group.admin_default;
    }
    return true;
  }, []);

  return {
    columnConfig,
    cellRenderers,
    expansionRenderers,
    filterConfig,
    isCellExpandable,
  };
}
