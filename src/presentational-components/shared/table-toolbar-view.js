import React, { Fragment, useEffect, useState } from 'react';
import propTypes from 'prop-types';
import debouncePromise from 'awesome-debounce-promise';
import { Table, TableHeader, TableBody, TableVariant } from '@patternfly/react-table';
import { scrollToTop, getCurrentPage, getNewPage } from '../../helpers/shared/helpers';
import { defaultSettings  } from '../../helpers/shared/pagination';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components/components/PrimaryToolbar';
import { ListLoader } from './loader-placeholders';
import './table-toolbar-view.scss';

export const TableToolbarView = ({
  request,
  isSelectable,
  isCompact,
  createRows,
  borders,
  columns,
  toolbarButtons,
  fetchData,
  data,
  actionResolver,
  areActionsDisabled,
  routes,
  titlePlural,
  titleSingular,
  pagination,
  checkedRows,
  setCheckedItems,
  filterValue,
  isLoading,
  setFilterValue }) => {
  const [ rows, setRows ] = useState([]);

  useEffect(() => {
    fetchData(pagination);
  }, [ filterValue, pagination.limit, pagination.offset ]);

  useEffect(() => {
    setRows(createRows(data, checkedRows, filterValue));
    if (isSelectable) {
      setCheckedItems(rows.filter(item => (item.uuid && item.selected)));
    }
  }, [ data ]);

  useEffect(() => {
    scrollToTop();
  }, []);

  const handleSetPage = (number, debounce) => {
    const options = {
      offset: getNewPage(number, pagination.limit),
      limit: pagination.limit
    };
    const requestFunc = () => request(options);
    return debounce ? debouncePromise(request, 250)() : requestFunc()
    .then(({ value: { data }}) => setRows(createRows(data, checkedRows, filterValue)));
  };

  const setOpen = (data, uuid) => data.map(row => row.uuid === uuid ?
    {
      ...row,
      isOpen: !row.isOpen
    } : {
      ...row
    });

  const setSelected = (data, uuid) => {
    const newData = data.map(row => row.uuid === uuid ?
      {
        ...row,
        selected: !row.selected
      } : {
        ...row
      });

    const checkedItems = newData.filter(item => (item.uuid && item.selected));
    setCheckedItems(checkedItems);
    return newData;
  };

  const onCollapse = (_event, _index, _isOpen, { uuid }) => setRows((rows) => setOpen(rows, uuid));

  const selectRow = (_event, selected, index, { uuid } = {}) => index === -1
    ? setRows(rows.map(row => ({ ...row, selected })))
    : setRows((rows) => setSelected(rows, uuid));

  const renderToolbar = () => {
    return (
      <PrimaryToolbar
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
                fetchData({
                  ...pagination,
                  name: value
                });
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
              handleSetPage({
                ...pagination,
                page: 1
              });
              setFilterValue('');
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
        aria-label={ `${titlePlural} table` }
        variant={ isCompact ? TableVariant.compact : null }
        borders={ borders }
        onCollapse={ onCollapse }
        rows={ rows }
        cells={ columns }
        onSelect={ isSelectable && selectRow }
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
  setCheckedItems: propTypes.func,
  filterValue: propTypes.string,
  checkedRows: propTypes.array,
  setFilterValue: propTypes.func,
  isLoading: propTypes.bool
};

TableToolbarView.defaultProps = {
  requests: [],
  isLoading: false,
  pagination: defaultSettings,
  toolbarButtons: () => null,
  isSelectable: false,
  isCompact: false,
  borders: true,
  routes: () => null,
  fetchData: () => undefined
};
