import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import type { Group } from '../../../../../../v2/data/queries/groups';
import { commonMessages } from '../../../../../../shared/messages/common';

// NOTE: Per V2 designs, only name/description/users/lastModified are shown.
// Roles, workspaces, and service accounts columns were removed from the table.
export const columns = ['name', 'description', 'principalCount', 'modified'] as const;
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
      name: { label: intl.formatMessage(commonMessages.name), sortable: true },
      description: {
        label: intl.formatMessage(commonMessages.description),
        width: 30,
      },
      principalCount: { label: intl.formatMessage(commonMessages.users), width: 10 },
      modified: {
        label: intl.formatMessage(commonMessages.lastModified),
        sortable: true,
        format: 'date',
        width: 15,
      },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, Group> = useMemo(
    () => ({
      name: (group) => group.name,
      description: (group) =>
        group.description ? (
          <Tooltip isContentLeftAligned content={group.description}>
            <span style={{ wordBreak: 'break-word' }}>
              {group.description.length > 40 ? `${group.description.slice(0, 37)}...` : group.description}
            </span>
          </Tooltip>
        ) : (
          <div className="pf-v6-u-color-400">
            {intl.formatMessage({ id: 'usersAndUserGroupsNoDescription', defaultMessage: 'No description', description: 'No description label' })}
          </div>
        ),
      principalCount: (group) => group.principalCount ?? 0,
      modified: (group) => group.modified ?? '',
    }),
    [intl],
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

  return {
    columnConfig,
    cellRenderers,
    filterConfig,
  };
}
