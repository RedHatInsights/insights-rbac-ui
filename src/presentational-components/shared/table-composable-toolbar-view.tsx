import React, { Fragment, ReactNode } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import TableToolbar from '@redhat-cloud-services/frontend-components/TableToolbar';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import { Button, EmptyStateActions, Pagination } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import Toolbar, { paginationBuilder } from './toolbar';
import EmptyWithAction from './empty-state';
import './table-toolbar-view.scss';
import { ISortBy, OnSort } from '@patternfly/react-table';
import { CellObject, CellType, SelectCell } from '../../smart-components/user/user-table-helpers';

interface FilterProps {
  username?: string;
  email?: string;
  status?: string[];
}

function isSelectCell(cell: any): cell is SelectCell {
  return typeof cell === 'object' && typeof cell.select !== 'undefined';
}

interface FetchDataProps {
  limit?: number;
  offset?: number;
  count?: number;
  noBottom?: boolean;

  filters?: FilterProps;
  orderBy?: string; // TODO: make required later

  username?: string;
  email?: string;
  status?: string[];
}

function isCellObject(cell: any): cell is CellObject {
  return typeof cell === 'object' && typeof cell.title !== 'undefined';
}

interface TableProps extends MainTableProps {
  emptyProps?: unknown;
  rowWrapper?: any;
  isExpandable?: boolean;
  hideHeader?: boolean;
}

interface MainTableProps {
  columns: Array<{ title: string; key?: string; sortable?: boolean }>;
  isSelectable: boolean;
  isLoading: boolean;
  noData?: boolean;
  data?: Array<unknown>; // used only in toolbar for selectable items
  title: { singular: string; plural: string };
  filterValue?: string;
  setFilterValue: (value: FilterProps) => void;
  pagination: { limit?: number; offset?: number; count?: number; noBottom?: boolean };
  fetchData: (config: FetchDataProps) => void;
  toolbarButtons?: () => (React.JSX.Element | { label: string; props: unknown; onClick: () => void })[];
  setCheckedItems?: (callback: (selected: unknown[]) => void) => void;
  checkedRows?: unknown[];
  filterPlaceholder?: string;
  filters: Array<{
    value: string | number | Array<unknown>;
    key: string;
    placeholder?: string;
    innerRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
    label?: string;
    type?: any;
    items?: any;
  }>;
  isFilterable?: boolean;
  onShowMore?: () => void;
  showMoreTitle?: string;
  onFilter?: () => void;
  onChange?: () => void;
  value?: unknown;
  hideFilterChips?: boolean;
  tableId?: string;
  textFilterRef?: undefined; // TODO: check the usage
  rows: Array<any>;
  sortBy: ISortBy;
  onSort: OnSort;
  isCompact: boolean;
  borders: boolean;
  ouiaId: string;
  noDataDescription?: Array<React.ReactNode>;
  emptyFilters: FilterProps;
}

const MainTable = ({
  // props for toolbar
  columns,
  isSelectable,
  isLoading,
  noData,
  title,
  filterValue,
  setFilterValue,
  pagination,
  fetchData,
  toolbarButtons,
  setCheckedItems,
  checkedRows,
  filterPlaceholder,
  filters,
  isFilterable,
  onShowMore,
  showMoreTitle,
  onFilter,
  onChange,
  value,
  hideFilterChips,
  tableId,
  textFilterRef,
  //
  rows,
  sortBy,
  onSort,
  isCompact,
  borders,
  ouiaId,
  noDataDescription,
  emptyFilters,
}: MainTableProps) => {
  const orderBy = sortBy?.index ? `${sortBy?.direction === 'desc' ? '-' : ''}${columns[sortBy.index]?.key}` : undefined;
  const intl = useIntl();
  return (
    <Fragment>
      <Toolbar
        isSelectable={isSelectable}
        isLoading={isLoading || noData}
        data={rows}
        titleSingular={title.singular}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        setCheckedItems={setCheckedItems}
        checkedRows={checkedRows}
        sortBy={orderBy}
        pagination={pagination}
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
      />
      {isLoading ? (
        <SkeletonTable variant={isCompact ? TableVariant.compact : undefined} rows={pagination?.limit} columns={columns.map((item) => item.title)} />
      ) : (
        <Table
          aria-label={`${title.plural.toLowerCase()} table`}
          variant={isCompact ? TableVariant.compact : undefined}
          borders={borders}
          ouiaId={ouiaId} // [PF]: Value to overwrite the randomly generated data-ouia-component-id
        >
          <Thead>
            <Tr>
              {columns.map((column, i) => (
                <Th key={i} sort={column?.sortable ? { columnIndex: i, sortBy, onSort } : undefined}>
                  {column.title}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {rows?.length > 0 ? (
              rows?.map((row, i) => (
                <Tr key={i}>
                  {row.cells.map((cell: CellType, j: number) => (
                    <Td key={j} dataLabel={columns[j].title} {...(isSelectCell(cell) && cell)}>
                      {/* TODO: make more general */}
                      {isCellObject(cell) ? (cell.title as string) : isSelectCell(cell) ? null : (cell as unknown as React.ReactNode)}
                    </Td>
                  ))}
                </Tr>
              ))
            ) : (
              <Tr>
                {/* render one component full width for the entire row */}
                <Td colSpan={columns.length}>
                  <EmptyWithAction
                    title={intl.formatMessage(messages.noMatchingItemsFound, { items: title.plural })}
                    description={
                      noData && noDataDescription
                        ? noDataDescription
                        : [
                            intl.formatMessage(messages.filterMatchesNoItems, { items: title.plural }),
                            intl.formatMessage(messages.tryChangingFilters),
                          ]
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
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}
      {!pagination.noBottom && (
        <TableToolbar>
          {!isLoading && <Pagination {...paginationBuilder(pagination, fetchData, filterValue, orderBy)} variant="bottom" dropDirection="up" />}
        </TableToolbar>
      )}
    </Fragment>
  );
};

export const TableComposableToolbarView = ({
  isCompact = false,
  borders,
  columns,
  rows,
  data,
  toolbarButtons,
  title,
  pagination,
  filterValue,
  isLoading,
  emptyFilters,
  setFilterValue,
  setCheckedItems,
  checkedRows,
  isSelectable = false,
  fetchData,
  emptyProps,
  filterPlaceholder,
  filters,
  isFilterable,
  onShowMore,
  showMoreTitle,
  onFilter,
  onChange,
  value,
  sortBy,
  onSort,
  hideFilterChips,
  noData,
  noDataDescription,
  ouiaId,
  tableId,
  textFilterRef,
}: TableProps) => {
  const intl = useIntl();

  return (
    <Fragment>
      {!isLoading && rows?.length === 0 && filterValue?.length === 0 && filters.every(({ value }) => !value) ? (
        <EmptyWithAction
          title={intl.formatMessage(messages.configureItems, { items: title.plural })}
          icon={PlusCircleIcon}
          description={[
            intl.formatMessage(messages.toConfigureUserAccess),
            intl.formatMessage(messages.createAtLeastOneItem, { item: title.singular }),
          ]}
          actions={toolbarButtons ? (toolbarButtons()[0] as ReactNode) : false}
          {...(typeof emptyProps === 'object' ? emptyProps : {})}
        />
      ) : (
        <MainTable
          setCheckedItems={setCheckedItems}
          columns={columns}
          isSelectable={isSelectable}
          isLoading={isLoading}
          noData={noData}
          data={data}
          title={title}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          pagination={pagination}
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
          rows={rows}
          sortBy={sortBy}
          onSort={onSort}
          isCompact={isCompact}
          borders={borders}
          ouiaId={ouiaId}
          noDataDescription={noDataDescription}
          emptyFilters={emptyFilters}
          checkedRows={checkedRows}
        />
      )}
    </Fragment>
  );
};
