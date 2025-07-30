import { Location, NavigateFunction } from 'react-router-dom';

export interface PaginationDefaultI {
  limit?: number;
  offset?: number;
  count?: number; // from API
  itemCount?: number; // for PF pagination
}

export const defaultSettings: Required<PaginationDefaultI> = {
  limit: 20,
  offset: 0,
  itemCount: 0,
  count: 0,
};

export const defaultAdminSettings = {
  ...defaultSettings,
  limit: 50,
};

export const defaultCompactSettings = {
  ...defaultSettings,
  limit: 10,
};

export const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

export const calculatePage = (limit = defaultSettings.limit, offset = 0) => Math.floor(offset / limit) + 1;

export const calculateOffset = (page = 1, limit = defaultSettings.limit) => (page - 1) * limit;

export const syncDefaultPaginationWithUrl = (location: Location, navigate: NavigateFunction, defaultPagination: Required<PaginationDefaultI>) => {
  if (!defaultPagination) {
    defaultPagination = defaultSettings;
  }
  const searchParams = new URLSearchParams(location.search);

  let limit = parseInt(searchParams.get('per_page') as string);
  let page = parseInt(searchParams.get('page') as string);

  if (isNaN(limit) || limit <= 0) {
    limit = defaultPagination.limit;
    searchParams.set('per_page', String(limit));
  }
  if (isNaN(page) || page <= 0) {
    page = 1;
    searchParams.set('page', String(page));
  }

  const offset = calculateOffset(page, limit);

  navigate(
    {
      pathname: location.pathname,
      search: searchParams.toString(),
    },
    { replace: true },
  );
  return { ...defaultPagination, limit, offset };
};

export const isPaginationPresentInUrl = (location: Location) => {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get('per_page') && searchParams.get('per_page');
};

export const isOffsetValid = (offset = 0, count = 0) => offset === 0 || count > offset;

export const getLastPageOffset = (count: number, limit: number) => Math.floor((count % limit === 0 ? count - 1 : count) / limit) * limit;
export const applyPaginationToUrl = (location: Location, navigate: NavigateFunction, limit: number, offset = 0) => {
  if (!offset) {
    offset = 0;
  }
  const searchParams = new URLSearchParams(location.search);
  searchParams.set('per_page', String(limit));
  searchParams.set('page', String(calculatePage(limit, offset)));
  navigate(
    {
      pathname: location.pathname,
      search: searchParams.toString(),
    },
    {
      replace: true,
    },
  );
};
