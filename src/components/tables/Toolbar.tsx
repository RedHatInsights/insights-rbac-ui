import React, { RefObject } from 'react';
import PrimaryToolbar from '@redhat-cloud-services/frontend-components/PrimaryToolbar';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { pickBy } from 'lodash';
import { calculateChecked, debouncedFetch, selectedRows } from '../../helpers/dataUtilities';
import { firstUpperCase } from '../../helpers/stringUtilities';
import { PER_PAGE_OPTIONS, calculateOffset, calculatePage, defaultSettings } from '../../helpers/pagination';

// Type definitions
interface PaginationData {
  limit?: number;
  offset?: number;
  count?: number;
}

export interface PaginationProps {
  toggleTemplate?: () => React.ReactElement;
  isCompact?: boolean;
}

interface FilterItem {
  key: string;
  value: string | number | string[] | unknown[];
  label?: string;
  selected?: boolean;
  placeholder?: string;
  type?: 'text' | 'checkbox' | 'group' | 'select';
  groups?: any[];
  items?: any[];
  innerRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

interface BulkSelectItem {
  title: string;
  onClick: () => void;
}

interface BulkSelectConfig {
  count: number;
  items: BulkSelectItem[];
  checked: boolean | null;
  onSelect: (value: boolean) => void;
  id?: string;
  isDisabled?: boolean;
}

interface FilterConfig {
  onChange?: (event: any, value: any) => void;
  value?: any;
  items: any[];
}

interface ActiveFiltersConfig {
  filters: any[];
  onDelete: (event: any, deleted: any[], isAll?: boolean) => void;
}

interface ToolbarProps {
  isSelectable?: boolean;
  isRowSelectable?: (row: any) => boolean;
  checkedRows?: any[];
  setCheckedItems?: ((items: any[]) => void) | ((callback: (selected: any[]) => void) => void);
  isLoading?: boolean;
  data?: any[];
  titleSingular?: string;
  filterValue?: string | string[];
  setFilterValue?: (value: any) => void;
  filters?: FilterItem[];
  isFilterable?: boolean;
  onShowMore?: () => void;
  showMoreTitle?: string;
  onFilter?: (value: any) => void;
  onChange?: (event: any, value: any) => void;
  value?: any;
  pagination?: PaginationData;
  paginationProps?: PaginationProps;
  sortBy?: string;
  filterItems?: any[];
  filterPlaceholder?: string;
  fetchData: (params: any) => Promise<any> | void;
  toolbarButtons?: () => any[];
  hideFilterChips?: boolean;
  tableId?: string;
  textFilterRef?: RefObject<HTMLInputElement>;
  toolbarChildren?: () => React.ReactNode;
}

export const paginationBuilder = (
  pagination: PaginationData = defaultSettings,
  fetchData: (params: any) => Promise<any> | void,
  filterValue: string | string[] = '',
  sortBy = '',
  paginationProps?: PaginationProps,
) => ({
  ...paginationProps,
  itemCount: pagination.count,
  perPage: pagination.limit,
  page: calculatePage(pagination.limit, pagination.offset),
  onSetPage: (_event: any, page: number) => {
    fetchData({
      ...pagination,
      offset: calculateOffset(page, pagination.limit),
      name: filterValue,
      orderBy: sortBy,
    });
  },
  perPageOptions: PER_PAGE_OPTIONS,
  onPerPageSelect: (_event: any, perPage: number) => {
    fetchData({
      offset: 0,
      limit: perPage,
      name: filterValue,
      orderBy: sortBy,
    });
  },
});

export const bulkSelectBuilder = (
  isLoading: boolean,
  checkedRows: any[] = [],
  setCheckedItems: ((items: any[]) => void) | ((callback: (selected: any[]) => void) => void) = () => undefined,
  data: any[] = [],
  tableId?: string,
  isRowSelectable: (row: any) => boolean = () => true,
): BulkSelectConfig => {
  const intl = useIntl();

  const items: BulkSelectItem[] = [
    {
      title: intl.formatMessage(messages.selectNone),
      onClick: () => {
        if (typeof setCheckedItems === 'function') {
          (setCheckedItems as (callback: (selected: any[]) => void) => void)(() => []);
        }
      },
    },
  ];

  if (!isLoading && data && data.length > 0) {
    items.push({
      title: intl.formatMessage(messages.selectPage, {
        length: data.filter(isRowSelectable).length,
      }),
      onClick: () => {
        if (typeof setCheckedItems === 'function') {
          const selectedItems = selectedRows(data, true)(checkedRows);
          (setCheckedItems as (callback: (selected: any[]) => void) => void)(() => selectedItems);
        }
      },
    });
  }

  return {
    count: checkedRows.length,
    items,
    checked: calculateChecked(data, checkedRows, isRowSelectable),
    onSelect: (value: boolean) => {
      if (!isLoading && typeof setCheckedItems === 'function') {
        const selectedItems = selectedRows(data, value)(checkedRows);
        (setCheckedItems as (callback: (selected: any[]) => void) => void)(() => selectedItems);
      }
    },
    id: tableId,
    isDisabled: isLoading,
  };
};

export const filterConfigBuilder = (
  isLoading: boolean,
  setFilterValue: (value: any) => void = () => undefined,
  fetchData: (params: any) => Promise<any> | void = () => undefined,
  filterValue: string | string[] = '',
  pagination: PaginationData = defaultSettings,
  titleSingular = '',
  filterPlaceholder?: string,
  filterItems?: any[],
  filters?: FilterItem[],
  isFilterable?: boolean,
  onShowMore?: () => void,
  showMoreTitle?: string,
  onFilter?: (value: any) => void,
  onChange?: (event: any, value: any) => void,
  value?: any,
  sortBy?: string,
  textFilterRef?: RefObject<HTMLInputElement>,
): FilterConfig => {
  // TODO: PatternFly PrimaryToolbar sets generic "Options menu" aria-label for filter dropdowns
  // This is an accessibility issue - screen readers should hear "Filter by Status" not "Options menu"
  // Requires investigation into PatternFly's proper API for custom aria-labels
  const intl = useIntl();
  return {
    onChange,
    value,
    items: [
      ...(filters && filters.length > 0
        ? filters.map(({ key, label, value, selected, placeholder, type = 'text', groups, items, innerRef }) => ({
            label: label || firstUpperCase(key),
            type: type ?? 'text',
            filterValues: {
              innerRef,
              id: `filter-by-${key}`,
              key: `filter-by-${key}`,
              placeholder: placeholder ? placeholder : intl.formatMessage(messages.filterByKey, { key }),
              value,
              selected,
              ...(type !== 'text' ? { isFilterable, onShowMore, showMoreTitle, onFilter } : ({} as any)),
              groups,
              items,
              onChange: (_e: any, filterBy: any) => {
                const newFilter =
                  typeof filterBy !== 'string' && !Array.isArray(filterBy) ? Object.keys(pickBy(filterBy[''], (value) => value)) : filterBy;

                setFilterValue({
                  ...(typeof filterValue === 'string' ? { name: filterValue } : filterValue),
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
                      {},
                    ),
                    [key]: newFilter,
                  }),
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
                onChange: (_e: any, value: string) => {
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
                    }),
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
  filterValue: string | string[] = '',
  filters?: FilterItem[],
  pagination: PaginationData = defaultSettings,
  setFilterValue: (value: any) => void = () => undefined,
  fetchData: (params: any) => Promise<any> | void = () => undefined,
  sortBy?: string,
): ActiveFiltersConfig => ({
  filters:
    filters && filters.length > 0
      ? filters
          .map(
            ({ key: type, value: options }) =>
              options &&
              (Array.isArray(options) || typeof options === 'string') &&
              options.length !== 0 && {
                category: firstUpperCase(type),
                type,
                chips: Array.isArray(options) ? options.map((filter) => ({ name: filter })) : [{ name: options }],
              },
          )
          .filter(Boolean)
      : [
          {
            name: typeof filterValue === 'string' ? filterValue : filterValue.join(', '),
          },
        ],
  onDelete: (_e: any, [deleted]: any[], isAll?: boolean) => {
    const setKeyValue = (value: any, type: string, key: string) => {
      if (isAll) {
        return type === 'group' || type === 'checkbox' ? [] : '';
      }

      if (key !== deleted.type) {
        return value;
      }

      if (type === 'checkbox' || type === 'group') {
        return value.filter((value: any) => value !== deleted.chips[0]?.name);
      }

      return Array.isArray(value) ? [] : '';
    };

    const filtersValue = filters?.reduce((acc, { key, value, type }) => ({ ...acc, [key]: setKeyValue(value, type || 'text', key) }), {}) || {};
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

const Toolbar: React.FC<ToolbarProps> = ({
  isSelectable = false,
  isRowSelectable = () => true,
  checkedRows = [],
  setCheckedItems = () => undefined,
  isLoading = false,
  data = [],
  titleSingular = '',
  filterValue = [],
  setFilterValue = () => undefined,
  pagination = defaultSettings,
  paginationProps,
  fetchData,
  sortBy,
  toolbarButtons = () => [],
  filterPlaceholder,
  filterItems = [],
  filters = [],
  isFilterable = false,
  onShowMore,
  showMoreTitle,
  onFilter,
  onChange,
  value,
  hideFilterChips = false,
  tableId,
  textFilterRef,
  toolbarChildren = () => null,
}) => (
  <PrimaryToolbar
    {...(isSelectable && {
      bulkSelect: bulkSelectBuilder(isLoading, checkedRows, setCheckedItems, data, tableId, isRowSelectable),
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
      textFilterRef,
    )}
    actionsConfig={{
      actions: toolbarButtons(),
    }}
    {...(!isLoading && {
      pagination: paginationBuilder(pagination, fetchData, filterValue, sortBy, paginationProps),
    })}
    {...(((typeof filterValue === 'string' ? filterValue.length > 0 : filterValue.length > 0) || (filters && filters.length > 0)) &&
      !hideFilterChips && {
        activeFiltersConfig: activeFiltersConfigBuilder(filterValue, filters, pagination, setFilterValue, fetchData, sortBy),
      })}
  >
    {toolbarChildren()}
  </PrimaryToolbar>
);

export { Toolbar };
