import React from 'react';
import PrimaryToolbar from '@redhat-cloud-services/frontend-components/PrimaryToolbar';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import messages from '../../Messages';
import { pickBy } from 'lodash';
import { selectedRows, calculateChecked, debouncedFetch, firstUpperCase } from '../../helpers/shared/helpers';
import { calculateOffset, calculatePage, defaultSettings } from '../../helpers/shared/pagination';

export const paginationBuilder = (pagination = {}, fetchData = () => undefined, filterValue = '', sortBy = '') => ({
  ...pagination,
  itemCount: pagination.count,
  perPage: pagination.limit,
  page: calculatePage(pagination.limit, pagination.offset),
  onSetPage: (_event, page) => {
    fetchData({
      ...pagination,
      offset: calculateOffset(page, pagination.limit),
      name: filterValue,
      orderBy: sortBy,
    });
  },
  perPageOptions: [
    { title: '5', value: 5 },
    { title: '10', value: 10 },
    { title: '20', value: 20 },
    { title: '50', value: 50 },
    { title: '100', value: 100 },
  ],
  onPerPageSelect: (_event, perPage) => {
    fetchData({
      ...pagination,
      offset: 0,
      limit: perPage,
      name: filterValue,
      orderBy: sortBy,
    });
  },
});

export const bulkSelectBuilder = (isLoading, checkedRows = [], setCheckedItems = () => undefined, data = [], tableId) => {
  const intl = useIntl();
  return {
    count: checkedRows.length,
    items: [
      {
        title: intl.formatMessage(messages.selectNone),
        onClick: () => {
          setCheckedItems(() => []);
        },
      },
      {
        ...(!isLoading && data && data.length > 0
          ? {
              title: intl.formatMessage(messages.selectPage, {
                length: data.filter((row) => !(row.platform_default || row.admin_default || row.system)).length,
              }),
              onClick: () => {
                setCheckedItems(selectedRows(data, true));
              },
            }
          : {}),
      },
    ],
    checked: calculateChecked(data, checkedRows),
    onSelect: (value) => {
      !isLoading && setCheckedItems(selectedRows(data, value));
    },
    id: tableId,
  };
};

export const filterConfigBuilder = (
  isLoading,
  setFilterValue = () => undefined,
  fetchData = () => undefined,
  filterValue = '',
  pagination = {},
  titleSingular = '',
  filterPlaceholder,
  filterItems,
  filters,
  isFilterable,
  onShowMore,
  showMoreTitle,
  onFilter,
  onChange,
  value,
  sortBy,
  textFilterRef
) => {
  const intl = useIntl();
  return {
    onChange,
    value,
    items: [
      ...(filters && filters.length > 0
        ? filters.map(({ key, label, value, selected, placeholder, type = 'text', groups, items, innerRef }) => ({
            label: label || firstUpperCase(key),
            type,
            filterValues: {
              innerRef,
              id: `filter-by-${key}`,
              key: `filter-by-${key}`,
              placeholder: placeholder ? placeholder : intl.formatMessage(messages.filterByKey, { key }),
              value,
              selected,
              ...(type !== 'text' ? { isFilterable, onShowMore, showMoreTitle, onFilter } : {}),
              groups,
              items,
              onChange: (_e, filterBy) => {
                const newFilter =
                  typeof filterBy !== 'string' && !Array.isArray(filterBy) ? Object.keys(pickBy(filterBy[''], (value) => value)) : filterBy;
                setFilterValue({
                  ...filterValue,
                  ...pagination,
                  offset: 0,
                  [key]: newFilter,
                });
                debouncedFetch(() =>
                  fetchData({
                    ...pagination,
                    offset: 0,
                    orderBy: sortBy,
                    ...filters.reduce(
                      (acc, curr) => ({
                        ...acc,
                        [curr.key]: curr.value,
                      }),
                      {}
                    ),
                    [key]: newFilter,
                  })
                ).then((data) => {
                  innerRef?.current?.focus();
                  return data;
                });
              },
              isDisabled: isLoading,
            },
          }))
        : [
            {
              label: firstUpperCase(filterPlaceholder || titleSingular),
              type: 'text',
              filterValues: {
                innerRef: textFilterRef,
                id: 'filter-by-string',
                key: 'filter-by-string',
                placeholder: intl.formatMessage(messages.filterByKey, { key: filterPlaceholder || titleSingular }),
                value: filterValue,
                onChange: (_e, value) => {
                  setFilterValue({
                    ...pagination,
                    offset: 0,
                    name: value,
                  });
                  debouncedFetch(() =>
                    fetchData({
                      ...pagination,
                      offset: 0,
                      name: value,
                      orderBy: sortBy,
                    })
                  ).then((data) => {
                    textFilterRef?.current?.focus();
                    return data;
                  });
                },
                isDisabled: isLoading,
              },
            },
          ]),
      ...(filterItems || []),
    ],
  };
};

export const activeFiltersConfigBuilder = (
  filterValue = '',
  filters,
  pagination = {},
  setFilterValue = () => undefined,
  fetchData = () => undefined,
  sortBy
) => ({
  filters:
    filters && filters.length > 0
      ? filters
          .map(
            ({ key: type, value: options }) =>
              options &&
              options.length !== 0 && {
                category: firstUpperCase(type),
                type,
                chips: Array.isArray(options) ? options.map((filter) => ({ name: filter })) : [{ name: options }],
              }
          )
          .filter(Boolean)
      : [
          {
            name: filterValue,
          },
        ],
  onDelete: (_e, [deleted], isAll) => {
    const setKeyValue = (value, type, key) => {
      if (isAll) {
        return type === 'group' || type === 'checkbox' ? [] : '';
      }

      if (key !== deleted.type) {
        return value;
      }

      if (type === 'checkbox' || type === 'group') {
        return value.filter((value) => value !== deleted.chips[0]?.name);
      }

      return Array.isArray(value) ? [] : '';
    };

    const filtersValue = filters.reduce((acc, { key, value, type }) => ({ ...acc, [key]: setKeyValue(value, type, key) }), {});
    setFilterValue({
      ...pagination,
      offset: 0,
      name: '',
      ...filtersValue,
    });
    fetchData({
      ...pagination,
      offset: 0,
      orderBy: sortBy,
      name: '',
      ...filtersValue,
    });
  },
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
  isFilterable,
  onShowMore,
  showMoreTitle,
  onFilter,
  onChange,
  value,
  hideFilterChips,
  tableId,
  textFilterRef,
}) => (
  <PrimaryToolbar
    {...(isSelectable && {
      bulkSelect: bulkSelectBuilder(isLoading, checkedRows, setCheckedItems, data, tableId),
    })}
    filterConfig={filterConfigBuilder(
      isLoading,
      setFilterValue,
      fetchData,
      filterValue,
      pagination,
      titleSingular,
      filterPlaceholder,
      filterItems,
      filters,
      isFilterable,
      onShowMore,
      showMoreTitle,
      onFilter,
      onChange,
      value,
      sortBy,
      textFilterRef
    )}
    useMobileLayout
    actionsConfig={{
      actions: toolbarButtons(),
    }}
    {...(!isLoading && {
      pagination: paginationBuilder(pagination, fetchData, filterValue, sortBy),
    })}
    {...((filterValue.length > 0 || (filters && filters.length > 0)) &&
      !hideFilterChips && {
        activeFiltersConfig: activeFiltersConfigBuilder(filterValue, filters, pagination, setFilterValue, fetchData, sortBy),
      })}
  />
);

Toolbar.propTypes = {
  isSelectable: PropTypes.bool,
  checkedRows: PropTypes.array,
  setCheckedItems: PropTypes.func,
  isLoading: PropTypes.bool,
  data: PropTypes.array,
  titleSingular: PropTypes.string,
  filterValue: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  setFilterValue: PropTypes.func,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
      key: PropTypes.string,
      placeholder: PropTypes.string,
    })
  ),
  isFilterable: PropTypes.bool,
  onShowMore: PropTypes.func,
  showMoreTitle: PropTypes.string,
  onFilter: PropTypes.func,
  onChange: PropTypes.func,
  value: PropTypes.any,
  pagination: PropTypes.shape({
    limit: PropTypes.number,
    offset: PropTypes.number,
    count: PropTypes.number,
  }),
  sortBy: PropTypes.string,
  filterItems: PropTypes.arrayOf(PropTypes.object),
  filterPlaceholder: PropTypes.string,
  isCollapsible: PropTypes.bool,
  fetchData: PropTypes.func,
  toolbarButtons: PropTypes.func,
  hideFilterChips: PropTypes.bool,
  tableId: PropTypes.string,
  textFilterRef: PropTypes.object,
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
  isFilterable: false,
  hideFilterChips: false,
};

export default Toolbar;
