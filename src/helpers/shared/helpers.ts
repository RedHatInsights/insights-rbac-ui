export const BAD_UUID = 'bad uuid';

import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/debounce';
import { calculatePage } from './pagination';

export const trimAll = (string: string): string => string.replace(/[-EFF]/g, '').trim();

export const scrollToTop = (): void => {
  const root = document.getElementById('root');
  if (root) {
    root.scrollTo({
      behavior: 'smooth',
      top: 0,
      left: 0,
    });
  }
};

export const mappedProps = (apiProps: Record<string, any>): Record<string, any> =>
  Object.entries(apiProps).reduce(
    (acc, [key, value]) => ({
      ...acc,
      ...(value && { [key]: value }),
    }),
    {},
  );

// @ts-expect-error: debouncePromise is a JS utility with a flexible signature
export const debouncedFetch = debouncePromise((callback: () => any) => callback());

export const calculateChecked = (rows: any[] = [], selected: any[], isRowSelectable: (row: any) => boolean = () => true): boolean | null => {
  const nonDefaults = rows.filter(isRowSelectable);
  return (
    (nonDefaults.length !== 0 && nonDefaults.every(({ uuid }) => selected.find((row) => row.uuid === uuid))) || (selected.length > 0 ? null : false)
  );
};

export const selectedRows =
  (newSelection: any[], isSelected: boolean) =>
  (selected: any[]): any[] => {
    if (!isSelected) {
      return selected.filter((row) => !newSelection.find(({ uuid }) => row.uuid === uuid));
    }
    return [...selected, ...newSelection].filter((row, key, arr) => arr.findIndex(({ uuid }) => row.uuid === uuid) === key);
  };

export const firstUpperCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const createQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (Array.isArray(value)) {
      value.forEach((item) => item && searchParams.append(key, item));
    } else {
      value && searchParams.set(key, value);
    }
  });
  return searchParams.toString();
};

export const removeQueryParams = (
  location: Location,
  navigate: (loc: { pathname: string; search: string }, opts: { replace: boolean }) => void,
): void => {
  navigate(
    {
      pathname: location.pathname,
      search: '',
    },
    {
      replace: true,
    },
  );
};

export const getBackRoute = (
  pathname: string,
  pagination: { limit: number; offset: number },
  filters: Record<string, any>,
): { pathname: string; search: string } => ({
  pathname,
  search: createQueryParams({
    per_page: pagination.limit,
    page: calculatePage(pagination.limit, pagination.offset),
    ...filters,
  }),
});

export const getDateFormat = (date: string): 'onlyDate' | 'relative' => {
  const monthAgo = new Date(Date.now());
  return Date.parse(date) < monthAgo.setMonth(monthAgo.getMonth() - 1) ? 'onlyDate' : 'relative';
};

export const isExternalIdp = (token: string = ''): boolean => {
  let roles = [''];
  let tokenArray = token.split('.');
  if (tokenArray.length > 1) {
    let token1 = window.atob(tokenArray[1]);
    if (token1) {
      roles = JSON.parse(token1)?.realm_access?.roles;
      if (roles.includes('external-idp')) {
        return true;
      }
    }
  }
  return false;
};
