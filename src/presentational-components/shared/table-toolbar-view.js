import React, { Fragment, useState } from 'react';
import propTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableVariant } from '@patternfly/react-table';
import { TableToolbar } from '@redhat-cloud-services/frontend-components';
import { Button, Pagination } from '@patternfly/react-core';
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
  textFilters
}) => {
  const [ opened, openRow ] = useState({});

  const rows = createRows(data, opened, checkedRows);

  const onCollapse = (_event, _index, isOpen, { uuid }) => openRow((opened) => ({
    ...opened,
    [uuid]: isOpen
  }));

  const renderEmpty = () => ({
    title: (
      <EmptyWithAction
        title={ `No matching ${titlePlural} found` }
        description={ [
          `This filter criteria matches no ${titlePlural}.`,
          `Try changing your filter settings.`
        ] }
        actions={ [
          <Button
            variant="link"
            key="clear-filters"
            onClick={ () => {
              setFilterValue({
                ...pagination,
                offset: 0,
                name: ''
              });
              fetchData({
                ...pagination,
                offset: 0,
                name: ''
              });
            } }
          >
            Clear all filters
          </Button>
        ] }
      />
    ),
    props: {
      colSpan: columns.length + Boolean(onCollapse)
    }
  });

  const renderTable = () => (
    <Fragment>
      <Toolbar
        isSelectable={ isSelectable }
        checkedRows={ checkedRows }
        setCheckedItems={ setCheckedItems }
        isLoading={ isLoading }
        data={ data }
        titleSingular={ titleSingular }
        filterValue={ filterValue }
        setFilterValue={ setFilterValue }
        pagination={ pagination }
        fetchData={ fetchData }
        toolbarButtons={ toolbarButtons }
        filterPlaceholder={ filterPlaceholder }
        textFilters={ textFilters }
      />
      { isLoading ? <ListLoader /> : <Table
        canSelectAll={ false }
        aria-label={ `${titlePlural} table` }
        variant={ isCompact ? TableVariant.compact : null }
        borders={ borders }
        { ...isCollapsible && { onCollapse } }
        { ...isSelectable && rows.length > 0 && {
          onSelect: (_e, isSelected, _idx, { uuid, cells: [ name ] }) =>
            setCheckedItems(selectedRows([{ uuid, name }], isSelected))
        } }
        rows={ rows.length > 0 ? rows : [{ fullWidth: true, cells: [ renderEmpty() ]}] }
        cells={ columns }
        { ...rows.length > 0 && { actionResolver } }
        areActionsDisabled={ areActionsDisabled }
        rowWrapper={ rowWrapper }
      >
        <TableHeader />
        <TableBody />
      </Table> }
      { !pagination.noBottom && <TableToolbar>
        {
          !isLoading &&
          <Pagination
            { ...paginationBuilder(pagination, fetchData, filterValue) }
            variant="bottom"
            dropDirection="up"
          />
        }
      </TableToolbar> }
    </Fragment>
  );

  return (
    <Fragment>
      { routes() }
      { !isLoading && rows.length === 0 && (filterValue.length === 0 && textFilters.every(({ value }) => !!value)) ?
        <EmptyWithAction
          title={ `Configure ${titlePlural}` }
          icon={ PlusCircleIcon }
          description={ [
            `To configure user access to applicastions`,
            `create at least one ${titleSingular}`
          ] }
          actions={ toolbarButtons()[0] }
          { ...emptyProps }
        /> :
        renderTable() }
    </Fragment>
  );
};

TableToolbarView.propTypes = {
  ...Toolbar.propTypes,
  rowWrapper: propTypes.any,
  isCompact: propTypes.bool,
  borders: propTypes.bool,
  createRows: propTypes.func.isRequired,
  columns: propTypes.array.isRequired,
  titlePlural: propTypes.string,
  routes: propTypes.func,
  actionResolver: propTypes.func,
  areActionsDisabled: propTypes.func
};

TableToolbarView.defaultProps = {
  ...Toolbar.defaultProps,
  isCompact: false,
  borders: true,
  routes: () => null
};
