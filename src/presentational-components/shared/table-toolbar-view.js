import React, { Fragment, useState } from 'react';
import propTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableVariant } from '@patternfly/react-table';
import { getCurrentPage } from '../../helpers/shared/helpers';
import { defaultSettings  } from '../../helpers/shared/pagination';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components/components/PrimaryToolbar';
import { ListLoader } from './loader-placeholders';
import './table-toolbar-view.scss';

const calculateChecked = (rows = [], selected) => {
  console.log(rows, 'huh');
  return (rows.length !== 0 && rows.every(({ uuid }) => selected.indexOf(uuid) !== -1)) || (
    (rows.length !== 0 && rows.some(({ uuid }) => selected.indexOf(uuid) !== -1)) ? null : false
  );
};

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
  setCheckedItems
}) => {
  const [ opened, openRow ] = useState({});

  const rows = createRows(data, opened, checkedRows);

  const onCollapse = (_event, _index, isOpen, { uuid }) => openRow({
    ...opened,
    [uuid]: isOpen
  });

  const renderToolbar = () => {
    return (
      <PrimaryToolbar
        { ...isSelectable && {
          bulkSelect: {
            count: checkedRows.length,
            items: [{
              title: 'Select none (0)',
              onClick: () => {
                setCheckedItems(-1, false);
              }
            },
            {
              ...!isLoading && data && data.length > 0 ? {
                title: `Select page (${data.length})`,
                onClick: () => {
                  setCheckedItems(0, true);
                }
              } : {}
            }],
            checked: calculateChecked(data, checkedRows),
            onSelect: (value) => {
              !isLoading && setCheckedItems(0, value);
            }
          }
        } }
        filterConfig={ {
          items: [{
            label: titleSingular,
            type: 'text',
            filterValues: {
              id: 'filter-by-string',
              key: 'filter-by-string',
              placeholder: `Filter by ${titleSingular}`,
              value: filterValue,
              onChange: (_e, value) => {
                setFilterValue({
                  ...pagination,
                  offset: 0,
                  name: value
                }, true);
              },
              isDisabled: isLoading
            }
          }]
        } }
        actionsConfig={ {
          actions: toolbarButtons()
        } }
        { ...!isLoading && {
          pagination: {
            itemCount: pagination.count,
            perPage: pagination.limit,
            page: getCurrentPage(pagination.limit, pagination.offset),
            onSetPage: (_event, page) => {
              setFilterValue({
                ...pagination,
                offset: (page - 1) * pagination.limit,
                name: filterValue
              }, false);
            },
            perPageOptions: [
              { title: '5', value: 5 },
              { title: '10', value: 10 },
              { title: '20', value: 20 },
              { title: '50', value: 50 }
            ],
            onPerPageSelect: (_event, perPage) => {
              setFilterValue({
                ...pagination,
                offset: 0,
                limit: perPage,
                name: filterValue
              }, false);
            }
          }
        } }
        { ...filterValue.length > 0 && {
          activeFiltersConfig: {
            filters: [{
              name: filterValue
            }],
            onDelete: () => {
              setFilterValue({
                ...pagination,
                offset: 0,
                name: ''
              }, false);
            }
          }
        }
        }
      />
    );
  };

  return (

    <Fragment>
      { routes() }
      { renderToolbar() }
      { isLoading ? <ListLoader /> : <Table
        canSelectAll={ false }
        aria-label={ `${titlePlural} table` }
        variant={ isCompact ? TableVariant.compact : null }
        borders={ borders }
        onCollapse={ onCollapse }
        { ...isSelectable && { onSelect: setCheckedItems } }
        rows={ rows }
        cells={ columns }
        actionResolver={ actionResolver }
        areActionsDisabled={ areActionsDisabled }
      >
        <TableHeader />
        <TableBody />
      </Table> }
    </Fragment>
  );
};

TableToolbarView.propTypes = {
  isSelectable: propTypes.bool,
  isCompact: propTypes.bool,
  borders: propTypes.bool,
  createRows: propTypes.func.isRequired,
  request: propTypes.func.isRequired,
  columns: propTypes.array.isRequired,
  toolbarButtons: propTypes.func,
  fetchData: propTypes.func.isRequired,
  data: propTypes.array,
  pagination: propTypes.shape({
    limit: propTypes.number,
    offset: propTypes.number,
    count: propTypes.number
  }),
  titlePlural: propTypes.string,
  titleSingular: propTypes.string,
  routes: propTypes.func,
  actionResolver: propTypes.func,
  areActionsDisabled: propTypes.func,
  filterValue: propTypes.string,
  checkedRows: propTypes.array,
  setCheckedItems: propTypes.func,
  setFilterValue: propTypes.func,
  isLoading: propTypes.bool
};

TableToolbarView.defaultProps = {
  checkedRows: [],
  requests: [],
  isLoading: false,
  pagination: defaultSettings,
  toolbarButtons: () => null,
  isSelectable: false,
  isCompact: false,
  borders: true,
  setCheckedItems: () => null,
  routes: () => null,
  fetchData: () => undefined
};
