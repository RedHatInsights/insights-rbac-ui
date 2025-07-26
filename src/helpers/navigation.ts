import { Location, NavigateFunction } from 'react-router-dom';
import { calculatePage } from './pagination';

// Type for query parameters - similar to URL filters but more flexible for navigation
type QueryParamValue = string | number | boolean | string[] | undefined;
type QueryParams = Record<string, QueryParamValue>;

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

export const createQueryParams = (params: QueryParams): string => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (Array.isArray(value)) {
      value.forEach((item) => item && searchParams.append(key, String(item)));
    } else {
      value && searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

export const removeQueryParams = (location: Location, navigate: NavigateFunction): void => {
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
  filters: QueryParams,
): { pathname: string; search: string } => ({
  pathname,
  search: createQueryParams({
    per_page: pagination.limit,
    page: calculatePage(pagination.limit, pagination.offset),
    ...filters,
  }),
});
