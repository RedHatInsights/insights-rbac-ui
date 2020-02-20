import React from 'react';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components/components/PrimaryToolbar';
import { ConditionalFilter } from '@redhat-cloud-services/frontend-components/components/ConditionalFilter';
import PropTypes from 'prop-types';
import { getCurrentPage, selectedRows, calculateChecked, debouncedFetch, firstUpperCase } from '../../helpers/shared/helpers';
import { defaultSettings } from '../../helpers/shared/pagination';

export const paginationBuilder = (pagination = {}, fetchData = () => undefined, filterValue = '') => ({
  ...pagination,
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
  titleSingular = '',
  filterPlaceholder,
  filterItems,
  textFilters
) => ({
  items: [ ...textFilters && textFilters.length > 0 ? textFilters.map(({ key, value }) => ({
    label: firstUpperCase(key),
    type: 'text',
    filterValues: {
      id: `filter-by-${key}`,
      key: `filter-by-${key}`,
      placeholder: `Filter by ${key}`,
      value,
      onChange: (_e, filterBy) => {
        setFilterValue({
          ...pagination,
          offset: 0,
          [key]: filterBy
        });
        debouncedFetch(() => fetchData({
          ...pagination,
          offset: 0,
          [key]: filterBy
        }));
      },
      isDisabled: isLoading
    }})) : [{
    label: firstUpperCase(filterPlaceholder || titleSingular),
    type: 'text',
    filterValues: {
      id: 'filter-by-string',
      key: 'filter-by-string',
      placeholder: `Filter by ${filterPlaceholder || titleSingular}`,
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
  }], ...filterItems || [] ]
});

export const activeFiltersConfigBuilder = (
  filterValue = '',
  textFilters,
  pagination = {},
  setFilterValue  = () => undefined,
  fetchData = () => undefined
) => ({
  filters: textFilters ? textFilters.map(({ key, value }) => value && ({
    category: firstUpperCase(key),
    type: key,
    chips: [{ name: value }]
  })).filter(Boolean) : [{
    name: filterValue
  }],
  onDelete: (_e, [ deleted ], isAll) => {
    setFilterValue({
      ...pagination,
      offset: 0,
      name: '',
      ...textFilters ? textFilters.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: deleted.type === key || isAll ? '' : value
      }), {}) : {
        name: 'sf'
      }
    });
    fetchData({
      ...pagination,
      offset: 0,
      ...textFilters ? textFilters.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: deleted.type === key || isAll ? '' : value
      }), {}) : {
        name: ''
      }
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
  toolbarButtons,
  filterPlaceholder,
  filterItems,
  textFilters
}) => (
  <PrimaryToolbar
    { ...isSelectable && {
      bulkSelect: bulkSelectBuilder(isLoading, checkedRows, setCheckedItems, data) }
    }
    filterConfig={
      filterConfigBuilder(
        isLoading,
        setFilterValue,
        fetchData,
        filterValue,
        pagination,
        titleSingular,
        filterPlaceholder,
        filterItems,
        textFilters
      )
    }
    actionsConfig={ {
      actions: toolbarButtons()
    } }
    { ...!isLoading && {
      pagination: paginationBuilder(pagination, fetchData, filterValue)
    } }
    { ...(filterValue.length > 0 || textFilters) && {
      activeFiltersConfig: activeFiltersConfigBuilder(filterValue, textFilters, pagination, setFilterValue, fetchData)
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
  textFilters: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
    key: PropTypes.string
  })),
  pagination: PropTypes.shape({
    limit: PropTypes.number,
    offset: PropTypes.number,
    count: PropTypes.number
  }),
  filterItems: ConditionalFilter.propTypes.items,
  filterPlaceholder: PropTypes.string,
  isCollapsible: PropTypes.bool,
  fetchData: PropTypes.func,
  toolbarButtons: PropTypes.func
};

Toolbar.defaultProps = {
  isCollapsible: false,
  isSelectable: false,
  isLoading: false,
  data: [],
  titleSingular: '',
  filterValue: [],
  pagination: defaultSettings,
  setCheckedItems: () => undefined,
  setFilterValue: () => undefined,
  fetchData: () => undefined,
  toolbarButtons: () => [],
  filterItems: [],
  textFilters: []
};

export default Toolbar;
