import React, { Fragment, useState } from 'react';
import propTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableVariant } from '@patternfly/react-table';
import { getCurrentPage } from '../../helpers/shared/helpers';
import { defaultSettings  } from '../../helpers/shared/pagination';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components/components/PrimaryToolbar';
import { ListLoader } from './loader-placeholders';
import './table-toolbar-view.scss';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';

const debouncedFetch = debouncePromise(callback => callback());

const calculateChecked = (rows = [], selected) => {
  return (rows.length !== 0 && rows.every(({ uuid }) => selected.find(row => row.uuid === uuid))) || (
    (rows.length !== 0 && rows.some(({ uuid }) => selected.find(row => row.uuid === uuid))) ? null : false
  );
};

const selectedRows = (newSelection, isSelected) => (selected) => {
  if (!isSelected) {
    return selected.filter((row) => !newSelection.find(({ uuid }) => uuid === row.uuid));
  }

  return [
    ...selected,
    ...newSelection
  ].filter((row, key, arr) => arr.findIndex(({ uuid }) => row.uuid === uuid) === key);
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
  fetchData,
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
                setCheckedItems(() => []);
              }
            },
            {
              ...!isLoading && data && data.length > 0 ? {
                title: `Select page (${data.length})`,
                onClick: () => {
                  setCheckedItems(selectedRows(data, true));
                }
              } : {}
            }],
            checked: calculateChecked(data, checkedRows),
            onSelect: (value) => {
              !isLoading && setCheckedItems(selectedRows(data, value));
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
                });
                debouncedFetch(() => fetchData({
                  ...pagination,
                  offset: 0,
                  name: value
                }));
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
              fetchData({
                ...pagination,
                offset: (page - 1) * pagination.limit,
                name: filterValue
              });
            },
            perPageOptions: [
              { title: '5', value: 5 },
              { title: '10', value: 10 },
              { title: '20', value: 20 },
              { title: '50', value: 50 }
            ],
            onPerPageSelect: (_event, perPage) => {
              fetchData({
                ...pagination,
                offset: 0,
                limit: perPage,
                name: filterValue
              });
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
              fetchData({
                ...pagination,
                offset: 0,
                name: ''
              });
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
        { ...isSelectable && { onSelect: (_e, isSelected, _idx, { uuid, cells: [ name ] }) =>
          setCheckedItems(selectedRows([{ uuid, name }], isSelected))
        } }
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
