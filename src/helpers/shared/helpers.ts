export const BAD_UUID = 'bad uuid';

import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/debounce';
import { calculatePage } from './pagination';

export const trimAll = (string: string): string => string.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

export const scrollToTop = (): void =>
  document.getElementById('root')?.scrollTo({
    behavior: 'smooth',
    top: 0,
    left: 0,
  });

export const mappedProps = <T extends object>(apiProps: T): Partial<T> =>
  Object.entries(apiProps).reduce(
    (acc, [key, value]) => ({
      ...acc,
      ...(value && { [key]: value }),
    }),
    {}
  ) as Partial<T>;

export const debouncedFetch = debouncePromise((callback: () => Promise<any>) => callback());

interface Row {
  uuid: string;

  [key: string]: any;
}

export const calculateChecked = (rows: Row[] = [], selected: Row[], isRowSelectable: (row: Row) => boolean = () => true): boolean | null => {
  const nonDefaults = rows.filter(isRowSelectable);
  return (
    (nonDefaults.length !== 0 && nonDefaults.every(({ uuid }) => selected.find((row) => row.uuid === uuid))) || (selected.length > 0 ? null : false)
  );
};

export const selectedRows =
  (newSelection: Row[], isSelected: boolean) =>
  (selected: Row[]): Row[] => {
    if (!isSelected) {
      return selected.filter((row) => !newSelection.find(({ uuid }) => uuid === row.uuid));
    }

    return [...selected, ...newSelection].filter((row, key, arr) => arr.findIndex(({ uuid }) => row.uuid === uuid) === key);
  };

export const firstUpperCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

interface QueryParams {
  [key: string]: string | string[] | undefined;
}

export const createQueryParams = (params: QueryParams): string => {
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

interface Location {
  pathname: string;
  search: string;
}

interface NavigateOptions {
  replace?: boolean;
}

export const removeQueryParams = (location: Location, navigate: (to: Location, options: NavigateOptions) => void): void => {
  navigate(
    {
      pathname: location.pathname,
      search: '',
    },
    {
      replace: true,
    }
  );
};

interface Pagination {
  limit: number;
  offset: number;
}

interface Filters {
  [key: string]: string | undefined;
}

export const getBackRoute = (pathname: string, pagination: Pagination, filters: Filters): Location => ({
  pathname,
  search: createQueryParams({
    per_page: pagination.limit.toString(),
    page: calculatePage(pagination.limit, pagination.offset).toString(),
    ...filters,
  }),
});

export const getDateFormat = (date: string): 'onlyDate' | 'relative' => {
  const monthAgo = new Date(Date.now());
  return Date.parse(date) < monthAgo.setMonth(monthAgo.getMonth() - 1) ? 'onlyDate' : 'relative';
};

interface RealmAccess {
  roles: string[];
}

interface TokenPayload {
  realm_access?: RealmAccess;
}

export const isExternalIdp = (token: string = ''): boolean => {
  let roles: string[] = [''];
  const tokenArray = token.split('.');
  if (tokenArray.length > 1) {
    try {
      const token1 = window.atob(tokenArray[1]);
      if (token1) {
        const payload = JSON.parse(token1) as TokenPayload;
        roles = payload?.realm_access?.roles || [];
        if (roles.includes('external-idp')) {
          return true;
        }
      }
    } catch (e) {
      console.error('Error parsing token:', e);
    }
  }

  return false;
};
