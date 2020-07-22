import React from 'react';
import { PrimaryToolbar, ConditionalFilter } from '@redhat-cloud-services/frontend-components';
import PropTypes from 'prop-types';
import { getCurrentPage, selectedRows, calculateChecked, debouncedFetch, firstUpperCase } from '../../helpers/shared/helpers';
import { defaultSettings } from '../../helpers/shared/pagination';

export const paginationBuilder = (pagination = {}, fetchData = () => undefined, filterValue = '', sortBy = '') => ({
  ...pagination,
  itemCount: pagination.count,
  perPage: pagination.limit,
  page: getCurrentPage(pagination.limit, pagination.offset),
  onSetPage: (_event, page) => {
    fetchData({
      ...pagination,
      offset: (page - 1) * pagination.limit,
      name: filterValue,
      orderBy: sortBy
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
      name: filterValue,
      orderBy: sortBy
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
  filters,
  sortBy
) => ({
  items: [ ...filters && filters.length > 0 ? filters.map(({ key, value, placeholder, type = 'text', items }) => ({
    label: firstUpperCase(key),
    type,
    filterValues: {
      id: `filter-by-${key}`,
      key: `filter-by-${key}`,
      placeholder: placeholder ? placeholder : `Filter by ${key}`,
      value,
      items,
      onChange: (_e, filterBy) => {
        setFilterValue({
          ...pagination,
          offset: 0,
          [key]: filterBy
        });
        debouncedFetch(() => fetchData({
          ...pagination,
          offset: 0,
          orderBy: sortBy,
          ...filters.reduce((acc, curr) => ({
            ...acc,
            [curr.key]: curr.value
          }), {}),
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
          name: value,
          orderBy: sortBy
        }));
      },
      isDisabled: isLoading
    }
  }], ...filterItems || [] ]
});

export const activeFiltersConfigBuilder = (
  filterValue = '',
  filters,
  pagination = {},
  setFilterValue  = () => undefined,
  fetchData = () => undefined,
  sortBy
) => ({
  filters: (filters && filters.length > 0) ? filters.map(({ key: type, value: options }) => options.length !== 0 && ({
    category: firstUpperCase(type),
    type,
    chips: Array.isArray(options) ? options.map(filter => ({ name: filter })) : [{ name: options }]
  })).filter(Boolean) : [{
    name: filterValue
  }],
  onDelete: (_e, [ deleted ], isAll) => {
    const setKeyValue = (value, type) => {
      if (isAll) {
        return type === 'checkbox' ? [] : '';
      } else {
        return type === 'checkbox' ? value.filter(option => option !== deleted.chips[0].name) : '';
      }
    };

    setFilterValue({
      ...pagination,
      offset: 0,
      name: '',
      ...filters ? filters.reduce((acc, { key, value, type }) => ({
        ...acc,
        [key]: setKeyValue(value, type)
      }), {}) : {
        name: ''
      }});
    fetchData({
      ...pagination,
      offset: 0,
      orderBy: sortBy,
      ...filters ? filters.reduce((acc, { key, value }) => ({
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
  sortBy,
  toolbarButtons,
  filterPlaceholder,
  filterItems,
  filters,
  hideFilterChips
}) => (
  <PrimaryToolbar
    { ...isSelectable && {
      bulkSelect: bulkSelectBuilder(isLoading, checkedRows, setCheckedItems, data) } }
    filterConfig={ filterConfigBuilder(
        isLoading,
        setFilterValue,
        fetchData,
        filterValue,
        pagination,
        titleSingular,
        filterPlaceholder,
        filterItems,
        filters,
        sortBy
      ) }
    actionsConfig={ {
      actions: toolbarButtons()
    } }
    { ...!isLoading && {
      pagination: paginationBuilder(pagination, fetchData, filterValue, sortBy)
    } }
      { ...(filterValue.length > 0 || (filters && filters.length > 0)) && !hideFilterChips && {
        activeFiltersConfig: activeFiltersConfigBuilder(filterValue, filters, pagination, setFilterValue, fetchData, sortBy)
    } }
  />
);

Toolbar.propTypes = {
  isSelectable: PropTypes.bool,
  checkedRows: PropTypes.array,
  setCheckedItems: PropTypes.func,
  isLoading: PropTypes.bool,
  data: PropTypes.array,
  titleSingular: PropTypes.string,
  filterValue: PropTypes.oneOfType([ PropTypes.array, PropTypes.string ]),
  setFilterValue: PropTypes.func,
  filters: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number, PropTypes.array ]),
    key: PropTypes.string,
    placeholder: PropTypes.string
  })),
  pagination: PropTypes.shape({
    limit: PropTypes.number,
    offset: PropTypes.number,
    count: PropTypes.number
  }),
  sortBy: PropTypes.string,
  filterItems: ConditionalFilter.propTypes.items,
  filterPlaceholder: PropTypes.string,
  isCollapsible: PropTypes.bool,
  fetchData: PropTypes.func,
  toolbarButtons: PropTypes.func,
  hideFilterChips: PropTypes.bool
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
  sortBy: undefined,
  fetchData: () => undefined,
  toolbarButtons: () => [],
  filterItems: [],
  filters: [],
  hideFilterChips: false
};

export default Toolbar;
