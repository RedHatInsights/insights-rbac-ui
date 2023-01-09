import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';
import propTypes from 'prop-types';
import messages from '../../Messages';
import { Table, TableHeader, TableBody, TableVariant } from '@patternfly/react-table';
import TableToolbar from '@redhat-cloud-services/frontend-components/TableToolbar';
import { Button, Pagination, EmptyStatePrimary } from '@patternfly/react-core';
import { ListLoader } from './loader-placeholders';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { selectedRows } from '../../helpers/shared/helpers';
import Toolbar, { paginationBuilder } from './toolbar';
import EmptyWithAction from './empty-state';
import './table-toolbar-view.scss';

export const TableToolbarView = ({
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
  filterValue,
  isLoading,
  emptyFilters,
  setFilterValue,
  checkedRows,
  isSelectable,
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
  isExpandable,
  onExpand,
  hideFilterChips,
  hideHeader,
  noData,
  noDataDescription,
  ouiaId,
  tableId,
  containerRef,
  onSort,
  textFilterRef,
}) => {
  const intl = useIntl();
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
                <EmptyStatePrimary key="clear-filters">
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
                </EmptyStatePrimary>,
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
          checkedRows={checkedRows}
          setCheckedItems={setCheckedItems}
          isLoading={isLoading || noData}
          data={data}
          titleSingular={titleSingular}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
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
          containerRef={containerRef}
          textFilterRef={textFilterRef}
        />
        {isLoading ? (
          <ListLoader />
        ) : (
          <Table
            canSelectAll={false}
            aria-label={`${titlePlural.toLowerCase()} table`}
            variant={isCompact ? TableVariant.compact : null}
            borders={borders}
            {...(isSelectable &&
              rows?.length > 0 && {
                onSelect: (_e, isSelected, _idx, { uuid, cells: [name], requires }) =>
                  setCheckedItems(selectedRows([{ uuid, name, requires }], isSelected)),
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
            {!isLoading && <Pagination {...paginationBuilder(pagination, fetchData, filterValue, sortBy)} variant="bottom" dropDirection="up" />}
          </TableToolbar>
        )}
      </Fragment>
    );
  };

  return (
    <Fragment>
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
    </Fragment>
  );
};

TableToolbarView.propTypes = {
  ...Toolbar.propTypes,
  sortBy: propTypes.shape({
    directions: propTypes.string,
    index: propTypes.number,
  }),
  rowWrapper: propTypes.any,
  isCompact: propTypes.bool,
  borders: propTypes.bool,
  emptyFilters: propTypes.object,
  checkedRows: propTypes.array,
  columns: propTypes.array.isRequired,
  titlePlural: propTypes.string,
  routes: propTypes.func,
  actionResolver: propTypes.func,
  areActionsDisabled: propTypes.func,
  pagination: propTypes.shape({
    noBottom: propTypes.bool,
  }),
  isExpandable: propTypes.bool,
  onExpand: propTypes.func,
  hideFilterChips: propTypes.bool,
  hideHeader: propTypes.bool,
  noDataDescription: propTypes.arrayOf(propTypes.node),
  filters: propTypes.array,
  tableId: propTypes.string.isRequired,
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
};
