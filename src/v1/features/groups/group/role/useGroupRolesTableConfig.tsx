/**
 * GroupRoles Table Configuration Hook
 *
 * Provides column configuration, cell renderers, and filter configuration
 * for the GroupRoles table component.
 */

import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import { AppLink } from '../../../../../shared/components/navigation/AppLink';
import { getDateFormat } from '../../../../../shared/helpers/stringUtilities';

import pathnames from '../../../../utilities/pathnames';
import type { Role } from './types';
import { commonMessages } from '../../../../../shared/messages/common';

// Column definitions
export const columns = ['name', 'description', 'modified'] as const;
// Note: Sorting is not supported by the roles API - columns are not sortable
export const sortableColumns = [] as const;

export type SortableColumnId = never;

interface UseGroupRolesTableConfigOptions {
  intl: IntlShape;
  groupId: string;
}

interface UseGroupRolesTableConfigReturn {
  columnConfig: ColumnConfigMap<typeof columns>;
  cellRenderers: CellRendererMap<typeof columns, Role>;
  filterConfig: FilterConfig[];
}

export function useGroupRolesTableConfig({ intl, groupId }: UseGroupRolesTableConfigOptions): UseGroupRolesTableConfigReturn {
  // Column configuration with labels
  // Note: Sorting is not supported by the roles API
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(commonMessages.name) },
      description: { label: intl.formatMessage(commonMessages.description) },
      modified: { label: intl.formatMessage(commonMessages.lastModified) },
    }),
    [intl],
  );

  // Cell renderers for each column
  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      name: (role) => <AppLink to={pathnames['group-detail-role-detail'].link(groupId, role.uuid)}>{role.display_name || role.name}</AppLink>,
      description: (role) => role.description || '—',
      modified: (role) => (role.modified ? <DateFormat date={role.modified} type={getDateFormat(role.modified)} /> : '—'),
    }),
    [],
  );

  // Filter configuration
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
