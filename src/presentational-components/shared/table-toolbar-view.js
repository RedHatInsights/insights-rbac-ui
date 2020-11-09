import React, { Fragment, useState, useEffect } from 'react';
import propTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableVariant } from '@patternfly/react-table';
import { TableToolbar } from '@redhat-cloud-services/frontend-components';
import { Button, Pagination, EmptyStatePrimary } from '@patternfly/react-core';
import { ListLoader } from './loader-placeholders';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { selectedRows } from '../../helpers/shared/helpers';
import Toolbar, { paginationBuilder } from './toolbar';
import EmptyWithAction from './empty-filter';
import './table-toolbar-view.scss';

export const TableToolbarView = ({
  isCompact,
  createRows,
  borders,
  columns,
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
  setFilterValue,
  checkedRows,
  isSelectable,
  fetchData,
  setCheckedItems,
  isCollapsible,
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
}) => {
  const [opened, openRow] = useState({});
  const [sortByState, setSortByState] = useState({ index: undefined, direction: undefined });
  useEffect(() => {
    setSortByState({
      ...sortBy,
      ...(sortByState.index !== undefined && sortByState),
    });
  }, [sortBy]);

  const rows = createRows(data, opened, checkedRows);

  const onCollapse = (_event, _index, isOpen, { uuid }) =>
    openRow((opened) => ({
      ...opened,
      [uuid]: isOpen,
    }));

  const renderEmpty = () => ({
    title: (
      <EmptyWithAction
        title={`No matching ${titlePlural} found`}
        description={
          noData && noDataDescription ? noDataDescription : [`This filter criteria matches no ${titlePlural}.`, `Try changing your filter settings.`]
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
                      setFilterValue({
                        ...pagination,
                        offset: 0,
                        name: '',
                      });
                      fetchData({
                        ...pagination,
                        offset: 0,
                        name: '',
                      });
                    }}
                  >
                    Clear all filters
                  </Button>
                </EmptyStatePrimary>,
              ]
        }
      />
    ),
    props: {
      colSpan: columns.length + Boolean(onCollapse),
    },
  });

  const renderTable = () => (
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
        sortBy={
          (sortByState.index !== undefined &&
            sortByState.index - isSelectable >= 0 &&
            `${sortByState.direction === 'desc' ? '-' : ''}${columns[sortByState.index - isSelectable].key}`) ||
          undefined
        }
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
      />
      {isLoading ? (
        <ListLoader />
      ) : (
        <Table
          canSelectAll={false}
          aria-label={`${titlePlural} table`}
          variant={isCompact ? TableVariant.compact : null}
          borders={borders}
          {...(isCollapsible && { onCollapse })}
          {...(isSelectable &&
            rows.length > 0 && {
              onSelect: (_e, isSelected, _idx, { uuid, cells: [name] }) => setCheckedItems(selectedRows([{ uuid, name }], isSelected)),
            })}
          {...(isExpandable && { onExpand })}
          rows={rows.length > 0 ? rows : [{ fullWidth: true, cells: [renderEmpty()] }]}
          cells={columns}
          {...(rows.length > 0 && { actionResolver })}
          areActionsDisabled={areActionsDisabled}
          rowWrapper={rowWrapper}
          sortBy={sortByState}
          ouiaId={ouiaId}
          onSort={(e, index, direction) => {
            setSortByState({ index, direction });
            fetchData({
              ...pagination,
              offset: 0,
              name: filterValue,
              orderBy: `${direction === 'desc' ? '-' : ''}${columns[index - isSelectable].key}`,
            });
          }}
        >
          {!hideHeader && <TableHeader />}
          <TableBody />
        </Table>
      )}
      {!pagination.noBottom && (
        <TableToolbar>
          {!isLoading && <Pagination {...paginationBuilder(pagination, fetchData, filterValue)} variant="bottom" dropDirection="up" />}
        </TableToolbar>
      )}
    </Fragment>
  );

  return (
    <Fragment>
      {routes()}
      {!isLoading && rows.length === 0 && filterValue.length === 0 && filters.every(({ value }) => !value) ? (
        <EmptyWithAction
          title={`Configure ${titlePlural}`}
          icon={PlusCircleIcon}
          description={[`To configure user access to applications`, `create at least one ${titleSingular}`]}
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
  checkedRows: propTypes.array,
  createRows: propTypes.func.isRequired,
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
};

TableToolbarView.defaultProps = {
  ...Toolbar.defaultProps,
  isCompact: false,
  borders: true,
  routes: () => null,
  hideFilterChips: false,
  checkedRows: [],
  hideHeader: false,
};
