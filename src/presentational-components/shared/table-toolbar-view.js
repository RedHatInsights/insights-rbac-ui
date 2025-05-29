import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';
import propTypes from 'prop-types';
import messages from '../../Messages';
import { useFlag } from '@unleash/proxy-client-react';
import { TableVariant } from '@patternfly/react-table';
import { Table, TableBody, TableHeader } from '@patternfly/react-table/deprecated';
import TableToolbar from '@redhat-cloud-services/frontend-components/TableToolbar';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import { Button, EmptyStateActions, Pagination } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { selectedRows } from '../../helpers/shared/helpers';
import Toolbar, { paginationBuilder } from './toolbar';
import EmptyWithAction from './empty-state';
import './table-toolbar-view.scss';

export const TableToolbarView = ({
  className,
  isCompact,
  borders,
  columns,
  rows,
  toolbarButtons,
  data,
  actionResolver,
  areActionsDisabled,
  routes,
  titlePlural,
  titleSingular,
  pagination,
  paginationProps,
  filterValue,
  isLoading,
  emptyFilters,
  setFilterValue,
  checkedRows,
  isSelectable,
  isRowSelectable,
  fetchData,
  setCheckedItems,
  emptyProps,
  filterPlaceholder,
  rowWrapper,
  filters,
  isFilterable,
  onShowMore,
  showMoreTitle,
  onFilter,
  onChange,
  value,
  sortBy,
  onSort,
  isExpandable,
  onExpand,
  hideFilterChips,
  hideHeader,
  noData,
  noDataDescription,
  ouiaId,
  tableId,
  containerRef,
  textFilterRef,
  toolbarChildren,
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
    const orderBy = `${sortBy?.direction === 'desc' ? '-' : ''}${columns[sortBy?.index]?.key}`;
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
          containerRef={containerRef}
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
            variant={isCompact ? TableVariant.compact : null}
            borders={borders}
            {...(isSelectable &&
              rows?.length > 0 && {
                onSelect: (_e, isSelected, _idx, { uuid, cells: [name], requires }) =>
                  setCheckedItems(selectedRows([{ uuid, name, requires, ...(isITLess && { username: data[_idx]?.username }) }], isSelected)),
              })}
            {...(isExpandable && { onExpand })}
            rows={rows?.length > 0 ? rows : [{ fullWidth: true, cells: [renderEmpty()] }]}
            cells={columns}
            {...(rows?.length > 0 && { actionResolver })}
            className={rows?.length == 0 ? 'ins-c-table-empty-state' : ''}
            areActionsDisabled={areActionsDisabled}
            rowWrapper={rowWrapper}
            sortBy={sortBy}
            ouiaId={ouiaId}
            onSort={(e, index, direction, isSelectable) => onSort(e, index, direction, isSelectable)}
          >
            {!hideHeader && <TableHeader />}
            <TableBody />
          </Table>
        )}
        {!pagination.noBottom && (
          <TableToolbar>
            {!isLoading && (
              <Pagination {...paginationBuilder(pagination, fetchData, filterValue, sortBy, paginationProps)} variant="bottom" dropDirection="up" />
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
          actions={toolbarButtons()[0]}
          {...emptyProps}
        />
      ) : (
        renderTable()
      )}
    </div>
  );
};

TableToolbarView.propTypes = {
  ...Toolbar.propTypes,
  sortBy: propTypes.shape({
    directions: propTypes.string,
    index: propTypes.number,
  }),
  className: propTypes.string,
  rowWrapper: propTypes.any,
  isCompact: propTypes.bool,
  isRowSelectable: propTypes.func,
  borders: propTypes.bool,
  emptyFilters: propTypes.object,
  checkedRows: propTypes.array,
  columns: propTypes.array.isRequired,
  rows: propTypes.array.isRequired,
  titlePlural: propTypes.string,
  routes: propTypes.func,
  actionResolver: propTypes.func,
  areActionsDisabled: propTypes.func,
  pagination: propTypes.shape({
    noBottom: propTypes.bool,
    limit: propTypes.number,
    offset: propTypes.number,
    count: propTypes.number,
  }),
  paginationProps: propTypes.shape({
    toggleTemplate: propTypes.func,
    isCompact: propTypes.bool,
  }),
  isExpandable: propTypes.bool,
  onExpand: propTypes.func,
  onSort: propTypes.func,
  containerRef: propTypes.node,
  noData: propTypes.bool,
  hideFilterChips: propTypes.bool,
  hideHeader: propTypes.bool,
  noDataDescription: propTypes.arrayOf(propTypes.node),
  filters: propTypes.array,
  tableId: propTypes.string.isRequired,
  toolbarChildren: propTypes.func,
};

TableToolbarView.defaultProps = {
  ...Toolbar.defaultProps,
  emptyFilters: {},
  isCompact: false,
  borders: true,
  routes: () => null,
  hideFilterChips: false,
  checkedRows: [],
  hideHeader: false,
  toolbarChildren: () => null,
};
