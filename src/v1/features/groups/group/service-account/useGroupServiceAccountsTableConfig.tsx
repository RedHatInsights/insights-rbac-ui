import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';

import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';

import type { ServiceAccount } from './types';
import { getDateFormat } from '../../../../../shared/helpers/stringUtilities';
import { commonMessages } from '../../../../../shared/messages/common';

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
      name: { label: intl.formatMessage(commonMessages.name) },
      clientId: { label: intl.formatMessage({ id: 'clientId', defaultMessage: 'Client ID', description: 'Client ID column label' }) },
      owner: { label: intl.formatMessage({ id: 'owner', defaultMessage: 'Owner', description: 'Owner column label' }) },
      timeCreated: { label: intl.formatMessage({ id: 'timeCreated', defaultMessage: 'Time created', description: 'Time created column label' }) },
    }),
    [intl],
  );

  // Cell renderers are pure functions with no reactive dependencies - no memoization needed
  const cellRenderers: CellRendererMap<typeof columns, ServiceAccount> = {
    name: (account) => account.name || '—',
    clientId: (account) => account.clientId || '—',
    owner: (account) => account.owner || '—',
    timeCreated: (account) => {
      // Use nullish check to handle valid epoch timestamp (0)
      if (account.time_created == null) return '—';
      // time_created is already in milliseconds (normalized in query layer)
      const dateStr = new Date(account.time_created).toISOString();
      return <DateFormat date={dateStr} type={getDateFormat(dateStr)} />;
    },
  };

  const filterConfig: FilterConfig[] = useMemo(() => {
    const clientIdLabel = intl.formatMessage({ id: 'clientId', defaultMessage: 'Client ID', description: 'Client ID column label' });
    const nameLabel = intl.formatMessage(commonMessages.name);
    return [
      {
        type: 'text',
        id: 'clientId',
        label: clientIdLabel,
        placeholder: `Filter by ${clientIdLabel.toLowerCase()}`,
      },
      {
        type: 'text',
        id: 'name',
        label: nameLabel,
        placeholder: `Filter by ${nameLabel.toLowerCase()}`,
      },
    ];
  }, [intl]);

  return {
    columnConfig,
    cellRenderers,
    filterConfig,
  };
}
