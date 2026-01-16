import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { IntlShape } from 'react-intl';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../components/table-view';
import type { Group } from '../../../../../data/queries/groups';
import messages from '../../../../../Messages';

// NOTE: Per V2 API Strategy, roles and workspaces columns were REMOVED from design
export const columns = ['name', 'description', 'principalCount', 'serviceAccountCount', 'modified'] as const;
export const sortableColumns = ['name', 'modified'] as const;

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
      principalCount: { label: intl.formatMessage(messages.users) },
      serviceAccountCount: { label: intl.formatMessage(messages.serviceAccounts) },
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
            <span>{group.description.length > 40 ? `${group.description.slice(0, 37)}...` : group.description}</span>
          </Tooltip>
        ) : (
          <div className="pf-v6-u-color-400">{intl.formatMessage(messages['usersAndUserGroupsNoDescription'])}</div>
        ),
      principalCount: (group) => group.principalCount ?? 0,
      // NOTE: serviceAccountCount requires V2 API (gap:guessed-v2-api)
      serviceAccountCount: (group) => (group as any).serviceAccountCount ?? '—',
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
