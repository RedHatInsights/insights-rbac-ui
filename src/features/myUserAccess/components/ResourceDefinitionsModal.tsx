import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import React, { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';
import type { ResourceDefinition } from '../types';
import { TableView } from '../../../components/table-view/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../components/table-view/types';
import { getModalContainer } from '../../../helpers/modal-container';

interface ResourceDefinitionsModalProps {
  isOpen?: boolean;
  handleClose: () => void;
  permission: string;
  resourceDefinitions: ResourceDefinition[];
}

interface ResourceRow {
  id: string;
  value: string;
}

// Column definition
const columns = ['value'] as const;

export const ResourceDefinitionsModal: React.FC<ResourceDefinitionsModalProps> = ({ isOpen, handleClose, permission, resourceDefinitions }) => {
  const intl = useIntl();
  const [filterValue, setFilterValue] = useState('');

  // Convert resource definitions to filterable data
  const allRows: ResourceRow[] = useMemo(
    () =>
      resourceDefinitions
        .map(({ attributeFilter }) => attributeFilter.value)
        .filter((value): value is string => typeof value === 'string')
        .map((value, index) => ({
          id: index.toString(),
          value,
        })),
    [resourceDefinitions],
  );

  // Apply filtering
  const filteredRows = useMemo(
    () => (filterValue ? allRows.filter((row) => row.value.toLowerCase().includes(filterValue.toLowerCase())) : allRows),
    [allRows, filterValue],
  );

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      value: { label: intl.formatMessage(messages.resourceDefinition) },
    }),
    [intl],
  );

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, ResourceRow> = useMemo(
    () => ({
      value: (row) => row.value,
    }),
    [],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'search',
        id: 'value',
        placeholder: intl.formatMessage(messages.filterByKey, {
          key: intl.formatMessage(messages.resourceDefinition).toLowerCase(),
        }),
      },
    ],
    [intl],
  );

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: Record<string, string | string[]>) => {
    setFilterValue((newFilters.value as string) || '');
  }, []);

  // Handle clear filter
  const handleClearFilter = useCallback(() => {
    setFilterValue('');
  }, []);

  return (
    <Modal
      appendTo={getModalContainer()}
      actions={[
        <Button key="close-action" variant="primary" onClick={handleClose}>
          {intl.formatMessage(messages.close)}
        </Button>,
      ]}
      variant="large"
      isOpen={isOpen}
      onClose={handleClose}
      title={intl.formatMessage(messages.resourceDefinitions)}
      description={
        <FormattedMessage
          {...messages.viewResourceDefinitions}
          values={{
            strong: (text: React.ReactNode) => <strong>{text}</strong>,
            permission,
          }}
        />
      }
    >
      <TableView<typeof columns, ResourceRow>
        columns={columns}
        columnConfig={columnConfig}
        data={filteredRows}
        totalCount={filteredRows.length}
        getRowId={(row) => row.id}
        cellRenderers={cellRenderers}
        page={1}
        perPage={filteredRows.length || 10}
        onPageChange={() => {}}
        onPerPageChange={() => {}}
        filterConfig={filterConfig}
        filters={{ value: filterValue }}
        onFiltersChange={handleFilterChange}
        clearAllFilters={handleClearFilter}
        variant="compact"
        ariaLabel={intl.formatMessage(messages.resourceDefinitions)}
        emptyStateNoData={
          <DefaultEmptyStateNoData title="No resource definitions" body={intl.formatMessage(messages.noResourceDefinitions, { permission })} />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(messages.noResultsFound)}
            body={`${intl.formatMessage(messages.filterMatchesNoItems, { items: 'resource definitions' })} ${intl.formatMessage(messages.tryChangingFilters)}`}
            onClearFilters={handleClearFilter}
          />
        }
      />
    </Modal>
  );
};
