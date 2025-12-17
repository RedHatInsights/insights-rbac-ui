/**
 * useGroupsTableConfig Hook
 *
 * Extracts table configuration (columns, renderers, filters, expansion)
 * from the Groups component into a reusable hook.
 */

import React, { useCallback, useMemo } from 'react';
import { Link, type To } from 'react-router-dom';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import type { IntlShape } from 'react-intl';

import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '../../components/table-view';
import { DefaultInfoPopover } from './components/DefaultInfoPopover';
import { GroupsRolesTable } from './components/GroupsRolesTable';
import { GroupsMembersTable } from './components/GroupsMembersTable';
import { getDateFormat } from '../../helpers/stringUtilities';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import type { Group } from './types';

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
  toAppLink: (to: To) => To;
}

interface UseGroupsTableConfigReturn {
  columnConfig: ColumnConfigMap<typeof columns>;
  cellRenderers: CellRendererMap<typeof columns, Group>;
  expansionRenderers: ExpansionRendererMap<CompoundColumnId, Group>;
  filterConfig: FilterConfig[];
  isCellExpandable: (group: Group, column: CompoundColumnId) => boolean;
}

export function useGroupsTableConfig({ intl, toAppLink }: UseGroupsTableConfigOptions): UseGroupsTableConfigReturn {
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name), sortable: true },
      roles: { label: intl.formatMessage(messages.roles), isCompound: true },
      members: { label: intl.formatMessage(messages.members), isCompound: true },
      modified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, Group> = useMemo(
    () => ({
      name: (group) => (
        <>
          <Link to={toAppLink((pathnames['group-detail-roles'].link as string).replace(':groupId', group.uuid))}>{group.name}</Link>
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
    [intl, toAppLink],
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
        label: intl.formatMessage(messages.name),
        placeholder: `Filter by ${intl.formatMessage(messages.name).toLowerCase()}`,
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
