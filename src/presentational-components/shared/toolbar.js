import React from 'react';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components/components/PrimaryToolbar';
import PropTypes from 'prop-types';
import { getCurrentPage, selectedRows, calculateChecked, debouncedFetch } from '../../helpers/shared/helpers';
import { defaultSettings } from '../../helpers/shared/pagination';

export const paginationBuilder = (pagination = {}, fetchData = () => undefined, filterValue = '') => ({
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
});

export const bulkSelectBuilder = (isLoading, checkedRows = {}, setCheckedItems = () => undefined, data = []) => ({
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
});

export const filterConfigBuilder = (
  isLoading,
  setFilterValue = () =>  undefined,
  fetchData = () => undefined,
  filterValue = '',
  pagination = {},
  titleSingular = ''
) => ({
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
});

export const activeFiltersConfigBuilder = (
  filterValue = '',
  pagination = {},
  setFilterValue  = () => undefined,
  fetchData = () => undefined
) => ({
  filters: [{
    name: filterValue
  }],
  onDelete: () => {
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
  }
});

const Toolbar = ({
  isSelectable,
  checkedRows,
  setCheckedItems,
  isLoading,
  data,
  titleSingular,
  filterValue,
  setFilterValue,
  pagination,
  fetchData,
  toolbarButtons
}) => (
  <PrimaryToolbar
    { ...isSelectable && {
      bulkSelect: bulkSelectBuilder(isLoading, checkedRows, setCheckedItems, data) }
    }
    filterConfig={
      filterConfigBuilder(isLoading, setFilterValue, fetchData, filterValue, pagination, titleSingular)
    }
    actionsConfig={ {
      actions: toolbarButtons()
    } }
    { ...!isLoading && {
      pagination: paginationBuilder(pagination, fetchData, filterValue)
    } }
    { ...filterValue.length > 0 && {
      activeFiltersConfig: activeFiltersConfigBuilder(filterValue, pagination, setFilterValue, fetchData)
    }
    }
  />
);

Toolbar.propTypes = {
  isSelectable: PropTypes.bool,
  checkedRows: PropTypes.array,
  setCheckedItems: PropTypes.func,
  isLoading: PropTypes.bool,
  data: PropTypes.array,
  titleSingular: PropTypes.string,
  filterValue: PropTypes.array,
  setFilterValue: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number,
    offset: PropTypes.number,
    count: PropTypes.number
  }),
  fetchData: PropTypes.func,
  toolbarButtons: PropTypes.func
};

Toolbar.defaultProps = {
  isSelectable: false,
  isLoading: false,
  data: [],
  titleSingular: '',
  filterValue: [],
  pagination: defaultSettings,
  setCheckedItems: () => undefined,
  setFilterValue: () => undefined,
  fetchData: () => undefined,
  toolbarButtons: () => []
};

export default Toolbar;
