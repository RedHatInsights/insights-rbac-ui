import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { IntlShape } from 'react-intl';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../components/table-view';
import type { Group } from '../../../../../data/queries/groups';
import messages from '../../../../../Messages';

export const columns = ['name', 'description', 'principalCount', 'serviceAccountCount', 'roleCount', 'workspaceCount', 'modified'] as const;
export const sortableColumns = ['name', 'principalCount', 'modified'] as const;

export type ColumnId = (typeof columns)[number];
export type SortableColumnId = (typeof sortableColumns)[number];

interface UseUserGroupsTableConfigOptions {
  intl: IntlShape;
}

interface UseUserGroupsTableConfigReturn {
  columnConfig: ColumnConfigMap<typeof columns>;
  cellRenderers: CellRendererMap<typeof columns, Group>;
  filterConfig: FilterConfig[];
}

export function useUserGroupsTableConfig({ intl }: UseUserGroupsTableConfigOptions): UseUserGroupsTableConfigReturn {
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      principalCount: { label: intl.formatMessage(messages.users), sortable: true },
      serviceAccountCount: { label: intl.formatMessage(messages.serviceAccounts) },
      roleCount: { label: intl.formatMessage(messages.roles) },
      workspaceCount: { label: intl.formatMessage(messages.workspaces) },
      modified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, Group> = useMemo(
    () => ({
      name: (group) => group.name,
      description: (group) =>
        group.description ? (
          <Tooltip isContentLeftAligned content={group.description}>
            <span>{group.description.length > 23 ? `${group.description.slice(0, 20)}...` : group.description}</span>
          </Tooltip>
        ) : (
          <div className="pf-v6-u-color-400">{intl.formatMessage(messages['usersAndUserGroupsNoDescription'])}</div>
        ),
      principalCount: (group) => group.principalCount ?? 0,
      serviceAccountCount: () => '?', // not currently in API
      roleCount: (group) => group.roleCount ?? 0,
      workspaceCount: () => '?', // not currently in API
      modified: (group) => (group.modified ? formatDistanceToNow(new Date(group.modified), { addSuffix: true }) : ''),
    }),
    [intl],
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

  return {
    columnConfig,
    cellRenderers,
    filterConfig,
  };
}
