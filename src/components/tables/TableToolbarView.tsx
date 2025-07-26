import React, { Fragment, RefObject } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { useFlag } from '@unleash/proxy-client-react';
import { TableVariant } from '@patternfly/react-table';
import { Table, TableBody, TableHeader } from '@patternfly/react-table/deprecated';
import TableToolbar from '@redhat-cloud-services/frontend-components/TableToolbar';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import { Button, EmptyStateActions, Pagination } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { selectedRows } from '../../helpers/dataUtilities';
import { Toolbar, paginationBuilder } from './Toolbar';
import { EmptyWithAction } from '../ui-states/EmptyState';
import './TableToolbarView.scss';

// Type definitions
interface PaginationData {
  noBottom?: boolean;
  limit?: number;
  offset?: number;
  count?: number;
}

interface PaginationProps {
  toggleTemplate?: () => React.ReactElement;
  isCompact?: boolean;
}

interface SortBy {
  direction?: 'asc' | 'desc';
  index?: number;
}

interface Column {
  key?: string;
  title: string;
  [key: string]: any;
}

interface Row {
  uuid?: string;
  cells: any[];
  fullWidth?: boolean;
  [key: string]: any;
}

interface FilterItem {
  key: string;
  value: any;
  [key: string]: any;
}

interface TableToolbarViewProps {
  className?: string;
  isCompact?: boolean;
  borders?: boolean;
  columns: Column[];
  rows: Row[];
  toolbarButtons: () => React.ReactNode[];
  data?: any[];
  actionResolver?: (rowData: any, extraData: any) => any[];
  areActionsDisabled?: (rowData: any) => boolean;
  routes: () => React.ReactNode;
  titlePlural: string;
  titleSingular: string;
  pagination: PaginationData;
  paginationProps?: PaginationProps;
  filterValue?: string | string[];
  isLoading?: boolean;
  emptyFilters?: Record<string, any>;
  setFilterValue: (value: any) => void;
  checkedRows?: any[];
  isSelectable?: boolean;
  isRowSelectable?: (row: any) => boolean;
  fetchData: (params: any) => void;
  setCheckedItems: ((items: any[]) => void) | ((callback: (selected: any[]) => void) => void);
  emptyProps?: Record<string, any>;
  filterPlaceholder?: string;
  rowWrapper?: any;
  filters: FilterItem[];
  isFilterable?: boolean;
  onShowMore?: () => void;
  showMoreTitle?: string;
  onFilter?: (value: any) => void;
  onChange?: (event: any, value: any) => void;
  value?: any;
  sortBy?: SortBy;
  onSort?: (event: any, index: number, direction: string, isSelectable: boolean) => void;
  isExpandable?: boolean;
  onExpand?: (event: any, rowIndex: number, colIndex: number, isOpen: boolean) => void;
  hideFilterChips?: boolean;
  hideHeader?: boolean;
  noData?: boolean;
  noDataDescription?: React.ReactNode[];
  ouiaId?: string;
  tableId: string;
  // containerRef?: RefObject<HTMLElement>; // Not used in Toolbar component
  textFilterRef?: RefObject<HTMLInputElement>;
  toolbarChildren?: () => React.ReactNode;
}

const TableToolbarView: React.FC<TableToolbarViewProps> = ({
  className,
  isCompact = false,
  borders = true,
  columns,
  rows,
  toolbarButtons,
  data = [],
  actionResolver,
  areActionsDisabled,
  routes = () => null,
  titlePlural,
  titleSingular,
  pagination,
  paginationProps,
  filterValue = [],
  isLoading = false,
  emptyFilters = {},
  setFilterValue,
  checkedRows = [],
  isSelectable = false,
  isRowSelectable = () => true,
  fetchData,
  setCheckedItems,
  emptyProps = {},
  filterPlaceholder,
  rowWrapper,
  filters = [],
  isFilterable = false,
  onShowMore,
  showMoreTitle,
  onFilter,
  onChange,
  value,
  sortBy,
  onSort,
  isExpandable = false,
  onExpand,
  hideFilterChips = false,
  hideHeader = false,
  noData = false,
  noDataDescription,
  ouiaId,
  tableId,
  textFilterRef,
  toolbarChildren = () => null,
}) => {
  const intl = useIntl();
  const isITLess = useFlag('platform.rbac.itless');

  const renderEmpty = () => ({
    title: (
      <EmptyWithAction
        title={intl.formatMessage(messages.noMatchingItemsFound, { items: titlePlural })}
        description={
          noData && noDataDescription
            ? noDataDescription
            : [intl.formatMessage(messages.filterMatchesNoItems, { items: titlePlural }), intl.formatMessage(messages.tryChangingFilters)]
        }
        actions={
          noData && noDataDescription
            ? undefined
            : [
                <EmptyStateActions key="clear-filters">
                  <Button
                    variant="link"
                    ouiaId="clear-filters-button"
                    onClick={() => {
                      setFilterValue(emptyFilters);
                      fetchData({
                        ...pagination,
                        offset: 0,
                        ...(emptyFilters ? emptyFilters : { name: '' }),
                      });
                    }}
                  >
                    {intl.formatMessage(messages.clearAllFilters)}
                  </Button>
                </EmptyStateActions>,
              ]
        }
      />
    ),
    props: {
      colSpan: columns.length,
    },
  });

  const renderTable = () => {
    const orderBy = `${sortBy?.direction === 'desc' ? '-' : ''}${columns[sortBy?.index || 0]?.key}`;
    return (
      <Fragment>
        <Toolbar
          isSelectable={isSelectable}
          isRowSelectable={isRowSelectable}
          checkedRows={checkedRows}
          setCheckedItems={setCheckedItems}
          isLoading={isLoading || noData}
          data={data}
          titleSingular={titleSingular}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          sortBy={orderBy}
          pagination={pagination}
          paginationProps={paginationProps}
          fetchData={fetchData}
          toolbarButtons={toolbarButtons}
          filterPlaceholder={filterPlaceholder}
          filters={filters}
          isFilterable={isFilterable}
          onShowMore={onShowMore}
          showMoreTitle={showMoreTitle}
          onFilter={onFilter}
          onChange={onChange}
          value={value}
          hideFilterChips={hideFilterChips}
          tableId={tableId}
          textFilterRef={textFilterRef}
          toolbarChildren={toolbarChildren}
        />
        {isLoading ? (
          <SkeletonTable
            variant={isCompact ? TableVariant.compact : undefined}
            rows={pagination?.limit}
            columns={columns.map((item) => item.title)}
          />
        ) : (
          <Table
            canSelectAll={false}
            aria-label={`${titlePlural.toLowerCase()} table`}
            variant={isCompact ? TableVariant.compact : undefined}
            borders={borders}
            {...(isSelectable &&
              rows?.length > 0 && {
                onSelect: (_e: any, isSelected: boolean, _idx: number, { uuid, cells: [name], requires }: any) => {
                  const selectedItems = selectedRows(
                    [{ uuid, name, requires, ...(isITLess && { username: data[_idx]?.username }) }],
                    isSelected,
                  )(checkedRows || []);
                  if (typeof setCheckedItems === 'function') {
                    // Check if the function expects a callback by looking at its parameter names
                    (setCheckedItems as (callback: (selected: any[]) => void) => void)(() => selectedItems);
                  }
                },
              })}
            {...(isExpandable && { onExpand })}
            rows={rows?.length > 0 ? rows : [{ fullWidth: true, cells: [renderEmpty()] }]}
            cells={columns}
            {...(rows?.length > 0 && { actionResolver })}
            className={rows?.length === 0 ? 'ins-c-table-empty-state' : ''}
            areActionsDisabled={areActionsDisabled}
            rowWrapper={rowWrapper}
            sortBy={sortBy}
            ouiaId={ouiaId}
            onSort={(e: any, index: number, direction: string, extraData: any) => onSort?.(e, index, direction, extraData)}
          >
            {!hideHeader && <TableHeader />}
            <TableBody />
          </Table>
        )}
        {!pagination?.noBottom && (
          <TableToolbar>
            {!isLoading && (
              <Pagination {...paginationBuilder(pagination, fetchData, filterValue, orderBy, paginationProps)} variant="bottom" dropDirection="up" />
            )}
          </TableToolbar>
        )}
      </Fragment>
    );
  };

  return (
    <div className={className}>
      {routes()}
      {!isLoading && rows?.length === 0 && filterValue?.length === 0 && filters.every(({ value }) => !value) ? (
        <EmptyWithAction
          title={intl.formatMessage(messages.configureItems, { items: titlePlural })}
          icon={PlusCircleIcon}
          description={[
            intl.formatMessage(messages.toConfigureUserAccess),
            intl.formatMessage(messages.createAtLeastOneItem, { item: titleSingular }),
          ]}
          actions={toolbarButtons?.()?.[0]}
          {...emptyProps}
        />
      ) : (
        renderTable()
      )}
    </div>
  );
};

export { TableToolbarView };
