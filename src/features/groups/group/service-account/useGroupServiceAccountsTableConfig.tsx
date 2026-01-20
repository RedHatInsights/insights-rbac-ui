import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../components/table-view';
import messages from '../../../../Messages';
import type { ServiceAccount } from './types';
import { getDateFormat } from '../../../../helpers/stringUtilities';

export const columns = ['name', 'clientId', 'owner', 'timeCreated'] as const;

export type ColumnId = (typeof columns)[number];

interface UseGroupServiceAccountsTableConfigOptions {
  intl: IntlShape;
}

interface UseGroupServiceAccountsTableConfigReturn {
  columnConfig: ColumnConfigMap<typeof columns>;
  cellRenderers: CellRendererMap<typeof columns, ServiceAccount>;
  filterConfig: FilterConfig[];
}

export function useGroupServiceAccountsTableConfig({ intl }: UseGroupServiceAccountsTableConfigOptions): UseGroupServiceAccountsTableConfigReturn {
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name) },
      clientId: { label: intl.formatMessage(messages.clientId) },
      owner: { label: intl.formatMessage(messages.owner) },
      timeCreated: { label: intl.formatMessage(messages.timeCreated) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, ServiceAccount> = useMemo(
    () => ({
      name: (account) => account.name || '—',
      clientId: (account) => account.clientId || '—',
      owner: (account) => account.owner || '—',
      timeCreated: (account) => {
        if (!account.time_created) return '—';
        // time_created is already in milliseconds (normalized in query layer)
        const dateStr = new Date(account.time_created).toISOString();
        return <DateFormat date={dateStr} type={getDateFormat(dateStr)} />;
      },
    }),
    [],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'clientId',
        label: intl.formatMessage(messages.clientId),
        placeholder: `Filter by ${intl.formatMessage(messages.clientId).toLowerCase()}`,
      },
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
