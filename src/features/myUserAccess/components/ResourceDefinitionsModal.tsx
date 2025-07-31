import { Button, EmptyState, EmptyStateActions, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Modal } from '@patternfly/react-core';
import React, { useState } from 'react';
import { DataViewTh } from '@patternfly/react-data-view';
import { DataView, DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { SearchInput } from '@patternfly/react-core';
import { FormattedMessage, useIntl } from 'react-intl';
import { SearchIcon } from '@patternfly/react-icons';
import messages from '../../../Messages';
import type { ResourceDefinition } from '../types';

interface ResourceDefinitionsModalProps {
  isOpen?: boolean;
  handleClose: () => void;
  permission: string;
  resourceDefinitions: ResourceDefinition[];
}

export const ResourceDefinitionsModal: React.FC<ResourceDefinitionsModalProps> = ({ isOpen, handleClose, permission, resourceDefinitions }) => {
  const intl = useIntl();
  const [filterValue, setFilterValue] = useState('');

  const columns: DataViewTh[] = [{ cell: intl.formatMessage(messages.resourceDefinition), props: { key: 'value' } }];

  // Convert resource definitions to filterable data
  const allRows = resourceDefinitions
    .map(({ attributeFilter }) => attributeFilter.value)
    .filter((value): value is string => typeof value === 'string')
    .map((value, index) => ({
      id: index.toString(),
      value,
    }));

  // Apply filtering
  const filteredRows = filterValue ? allRows.filter((row) => row.value.toLowerCase().includes(filterValue.toLowerCase())) : allRows;

  // Convert to DataView table format
  const rows = filteredRows.map((row) => ({
    id: row.id,
    row: [row.value],
  }));

  const handleFilterChange = (_event: any, value: string) => {
    setFilterValue(value);
  };

  const handleClearFilter = () => {
    setFilterValue('');
  };

  // Determine DataView state
  const isEmpty = allRows.length === 0;
  const isFilteredEmpty = filteredRows.length === 0;

  // Empty state components
  const EmptyNoData = () => (
    <EmptyState>
      <EmptyStateHeader titleText="No resource definitions" headingLevel="h4" />
      <EmptyStateBody>{intl.formatMessage(messages.noResourceDefinitions, { permission })}</EmptyStateBody>
    </EmptyState>
  );

  const EmptyWithFilters = () => (
    <EmptyState>
      <EmptyStateHeader titleText={intl.formatMessage(messages.noResultsFound)} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>
        {intl.formatMessage(messages.filterMatchesNoItems, { items: 'resource definitions' })} {intl.formatMessage(messages.tryChangingFilters)}
      </EmptyStateBody>
      <EmptyStateActions>
        <Button variant="link" onClick={handleClearFilter}>
          Clear filter
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );

  let activeState: DataViewState | undefined;
  if (isEmpty) {
    // We have no data at all - show general empty state
    activeState = DataViewState.empty;
  } else if (isFilteredEmpty) {
    // We have data but filtering results in no matches - show filtered empty state
    activeState = DataViewState.empty;
  } else {
    // We have data to display
    activeState = undefined;
  }

  return (
    <Modal
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
      <DataView activeState={activeState}>
        <DataViewToolbar
          filters={
            <SearchInput
              placeholder={intl.formatMessage(messages.filterByKey, {
                key: intl.formatMessage(messages.resourceDefinition).toLowerCase(),
              })}
              value={filterValue}
              onChange={handleFilterChange}
              onClear={handleClearFilter}
              aria-label={intl.formatMessage(messages.filterByKey, {
                key: intl.formatMessage(messages.resourceDefinitions).toLowerCase(),
              })}
            />
          }
        />
        <DataViewTable
          aria-label={intl.formatMessage(messages.resourceDefinitions)}
          columns={columns}
          rows={rows}
          variant="compact"
          bodyStates={{
            empty: isEmpty ? <EmptyNoData /> : <EmptyWithFilters />,
          }}
        />
      </DataView>
    </Modal>
  );
};
